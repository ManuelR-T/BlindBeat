import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from '@discordjs/voice'
import {
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  VoiceChannel,
} from 'discord.js'
import play from 'play-dl'

import { Command } from '@/types'

const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play music from a URL or search on YouTube')
  .addStringOption((option) =>
    option
      .setName('source')
      .setDescription('YouTube URL, or search terms for YouTube')
      .setRequired(true),
  )

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const source = interaction.options.get("source")?.value as string;
  let videoUrl: string | undefined;

  interaction.deferReply({ ephemeral: true });
  if ((await play.validate(source)) == "yt_video") {
    videoUrl = source;
  } else {
    const searchResults = await play.search(source, {
      limit: 1,
      source: { youtube: "video" },
    });
    if (searchResults.length > 0) {
      videoUrl = searchResults[0].url;
    } else {
      interaction.followUp({
        content: "No video found for the provided input.",
        ephemeral: true,
      });
      return;
    }
  }

  const member = interaction.member as GuildMember;
  const channel = member.voice.channel as VoiceChannel;
  if (!channel) {
    interaction.followUp({
      content: "You need to be in a voice channel to play music",
      ephemeral: true,
    });
    return;
  }

  const stream = await play.stream(videoUrl);
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  const player = createAudioPlayer();
  player.on(AudioPlayerStatus.Idle, () => {
    setTimeout(() => {
      if (player.state.status === AudioPlayerStatus.Idle) {
        connection.destroy();
      }
    }, 60000);
  });
  player.on("error", (error) => {
    console.error(`Error: ${error.message}`);
    connection.destroy();
  });

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guildId!,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  connection.on("error", (error) => {
    console.error(`Error: ${error.message}`);
    connection.destroy();
  });

  if (!connection) {
    interaction.followUp({
      content: "Failed to join the voice channel",
      ephemeral: true,
    });
    return;
  }

  connection.subscribe(player);

  player.play(resource);
  interaction.followUp({
    content: `Now playing: ${videoUrl}`,
    ephemeral: true,
  });
}

export default { data, execute } as Command
