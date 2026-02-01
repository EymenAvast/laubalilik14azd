require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const http = require('http');
const ffmpeg = require('ffmpeg-static');

// Render üzerinde botu canlı tutan sunucu
http.createServer((req, res) => { res.write("Bot 7/24 Aktif!"); res.end(); }).listen(process.env.PORT || 8080);

// SİSTEM AYARLARI
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

// SES DURUM TAKİBİ (Hata ayıklama için çok önemli)
player.on(AudioPlayerStatus.Playing, () => console.log('✅ SES ÇALINIYOR: Şu an ses kanalına veri gönderiliyor.'));
player.on(AudioPlayerStatus.Buffering, () => console.log('⏳ Ses hazırlanıyor (Buffering)...'));
player.on('error', error => console.error('❌ Oynatıcı Hatası:', error.message));

let connection = null;

client.on('ready', () => {
  console.log(`${client.user.tag} hazır! FFmpeg yolu aktif.`);
});

client.on('messageCreate', async (message) => {
  // KOMUT: !katıl
  if (message.content === "!katıl" && message.author.id === SAHIP_ID) {
    if (message.member?.voice.channel) {
      connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      connection.subscribe(player);
      
      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('🌐 Ses kanalına bağlantı sağlandı!');
        message.reply("Kanala girdim patron.");
      });
      return;
    }
    return message.reply("Önce bir ses kanalına girmelisin.");
  }

  // DM SESLENDİRME
  if (message.guild === null && message.author.id === SAHIP_ID) {
    if (!connection) return message.reply("Önce sunucuda beni kanala çağır yarrak: `!katıl`.");

    try {
      const url = googleTTS.getAudioUrl(message.content, {
        lang: 'tr',
        slow: false,
        host: 'https://translate.google.com',
      });

      // Ses kaynağını daha uyumlu (Arbitrary) modda oluşturuyoruz
      const resource = createAudioResource(url, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      
      resource.volume.setVolume(1.0); // Ses %100

      player.play(resource);
      message.react('✅'); 
      
    } catch (err) {
      console.error("Sistem Hatası:", err);
      message.reply("Ses motorunda bir hata oluştu.");
    }
  }
});

client.login(process.env.TOKEN);