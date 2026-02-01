require('dotenv').config();
require('prism-media');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const http = require('http');
const ffmpeg = require('ffmpeg-static');

// Botun kapanmaması için basit bir sunucu
http.createServer((req, res) => { res.write("Bot Aktif!"); res.end(); }).listen(process.env.PORT || 8080);

// GÜVENLİK: Sahip ID ve Token'ı Render'dan alıyoruz
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

// Hata ayıklama: Ses motoru sorunlarını loglara yazar
player.on('error', error => {
  console.error('Ses Çalma Hatası:', error.message);
});

let connection = null;

client.on('ready', () => {
  console.log(`${client.user.tag} hazır! FFmpeg Yolu: ${ffmpeg}`);
});

client.on('messageCreate', async (message) => {
  // Komut: !katıl
  if (message.content === "!katıl" && message.author.id === SAHIP_ID) {
    if (message.member?.voice.channel) {
      connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      connection.subscribe(player);
      return message.reply("Kanala girdim patron.");
    }
    return message.reply("Önce bir ses kanalına gir!");
  }

  // Komut: !ayrıl
  if (message.content === "!ayrıl" && message.author.id === SAHIP_ID) {
    if (connection) {
      connection.destroy();
      connection = null;
      return message.reply("Kanaldan ayrıldım.");
    }
  }

  // DM SESLENDİRME (Sadece senin yazdıklarını okur)
  if (message.guild === null && message.author.id === SAHIP_ID) {
    if (!connection) return message.reply("Önce sunucuda beni bir kanala çağır (!katıl).");

    try {
      const url = googleTTS.getAudioUrl(message.content, {
        lang: 'tr',
        slow: false,
        host: 'https://translate.google.com',
      });

      // FFmpeg üzerinden sesi işle
      const resource = createAudioResource(url, {
        inlineVolume: true
      });
      resource.volume.setVolume(1.0);

      player.play(resource);
      message.react('✅'); 
    } catch (err) {
      console.error("Sistem Hatası:", err);
      message.reply("Bir hata oluştu, logları kontrol et.");
    }
  }
});

client.login(process.env.TOKEN);