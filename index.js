require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const http = require('http');

// Render 7/24 Aktif Tutma Sunucusu
http.createServer((req, res) => { res.write("Bot 7/24 Aktif!"); res.end(); }).listen(process.env.PORT || 8080);

// --- AYARLAR ---
const SAHIP_ID = process.env.SAHIP_ID; // Kendi ID'ni buraya yazma, Render'a yazacağız!
// ---------------

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
  console.log(`${client.user.tag} hazır! Sahip ID: ${SAHIP_ID}`);
});

client.on('messageCreate', async (message) => {
  // 1. KOMUT: !katıl (Sadece sen sese sokabilirsin)
  if (message.content === "!katıl" && message.author.id === SAHIP_ID) {
    if (message.member?.voice.channel) {
      connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
        group: client.user.id
      });

      connection.subscribe(player);
      return message.reply("Sese geldim, patron! DM'lerini seslendirmek için bekliyorum.");
    } else {
      return message.reply("Önce bir ses kanalına girmelisin.");
    }
  }

  // 2. DM SESLENDİRME: Sadece senden gelen DM'leri okur
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
      message.react('🎙️'); // Seslendirildi işareti
    } catch (err) {
      console.error("Seslendirme Hatası:", err);
      message.reply("Seslendirme sırasında bir hata oluştu.");
    }
  }
});

client.login(process.env.TOKEN);