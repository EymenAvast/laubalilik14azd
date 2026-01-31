require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, VoiceConnectionStatus } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const http = require('http');
const ffmpeg = require('ffmpeg-static');

// Render 7/24 Aktif Tutma Sunucusu
http.createServer((req, res) => { 
    res.write("Bot Aktif!"); 
    res.end(); 
}).listen(process.env.PORT || 8080);

// FFmpeg yolunu sisteme tanıt (Hata almamak için kritik)
process.env.FFMPEG_PATH = ffmpeg;

const SAHIP_ID = process.env.SAHIP_ID;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel] 
});

const player = createAudioPlayer();
let connection = null;

client.on('ready', () => {
  console.log(`${client.user.tag} girişi yaptı. Sahip ID: ${SAHIP_ID}`);
});

client.on('messageCreate', async (message) => {
  // 1. KOMUT: !katıl (Sadece sahibi sese sokabilir)
  if (message.content === "!katıl" && message.author.id === SAHIP_ID) {
    if (message.member?.voice.channel) {
      connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      connection.subscribe(player);
      return message.reply("Kanala giriş yaptım. Yazmanı bekliyorum.");
    } else {
      return message.reply("Önce bir ses kanalına girmelisin.");
    }
  }

  // 2. DM SESLENDİRME: Sadece senin bota attığın DM'leri okur
  if (message.guild === null && message.author.id === SAHIP_ID) {
    if (!connection || connection.state.status === VoiceConnectionStatus.Disconnected) {
      return message.reply("Önce sunucuda `!katıl` yazarak beni bir kanala çağırmalısın.");
    }

    try {
      const url = googleTTS.getAudioUrl(message.content, {
        lang: 'tr',
        slow: false,
        host: 'https://translate.google.com',
      });

      const resource = createAudioResource(url);
      player.play(resource);
      message.react('✅'); 
    } catch (err) {
      console.error("Seslendirme Hatası:", err);
      message.reply("Ses iletiminde teknik bir sorun çıktı.");
    }
  }
});

client.login(process.env.TOKEN);