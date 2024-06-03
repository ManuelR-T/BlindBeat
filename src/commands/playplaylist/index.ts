import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import {
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  VoiceChannel,
} from "discord.js";
import { PrismaClient } from "@prisma/client";
import play from "play-dl";
import { logger } from "utils";

import { Command } from "@/types";

const prisma = new PrismaClient();

const data = new SlashCommandBuilder()
  .setName("playplaylist")
  .setDescription("Play music from a playlist")
  .addStringOption((option) =>
    option
      .setName("playlist")
      .setDescription("Name of the playlist")
      .setRequired(true)
  );

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const playlistName = interaction.options.get("playlist")?.value as string;
  const userId = interaction.user.id;

  // Find the playlist
  const playlist = await prisma.playlist.findFirst({
    where: { name: playlistName, userId: userId },
    include: { videos: true },
  });

  if (!playlist || playlist.videos.length === 0) {
    await interaction.reply({
      content: "Playlist not found or is empty.",
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const channel = member.voice.channel as VoiceChannel;
  if (!channel) {
    await interaction.reply({
      content: "You need to be in a voice channel to play music",
      ephemeral: true,
    });
    return;
  }

  if (!channel.joinable || !channel.speakable) {
    await interaction.reply({
      content: "I don't have permission to join or speak in that voice channel",
      ephemeral: true,
    });
    return;
  }

  const player = createAudioPlayer();
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guildId!,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  connection.subscribe(player);

  const playNext = async (index: number) => {
    if (index >= playlist.videos.length) {
      player.stop();
      connection.destroy();
      await interaction.followUp({
        content: "Playlist finished.",
        ephemeral: true,
      });
      return;
    }

    const videoUrl = playlist.videos[index].url;
    const stream = await play.stream(videoUrl);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    player.play(resource);
    await interaction.followUp({
      content: `Now playing: ${videoUrl}`,
      ephemeral: true,
    });

    player.on(AudioPlayerStatus.Idle, () => playNext(index + 1));
    player.on("error", (error) => {
      logger.error(`Error: ${error.message}`);
      playNext(index + 1);
    });
  };

  await interaction.deferReply();
  await playNext(0);
};

export default { data, execute } as Command;
