import { PrismaClient } from "@prisma/client";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "@/types";
import play from "play-dl";

const prisma = new PrismaClient();

const data = new SlashCommandBuilder()
  .setName("addtoplaylist")
  .setDescription("Add a URL to your playlist")
  .addStringOption((option) =>
    option
      .setName("playlist")
      .setDescription("Name of the playlist")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("url").setDescription("YouTube URL to add").setRequired(true)
  );

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const playlistName = interaction.options.get("playlist")?.value as string;
  const url = interaction.options.get("url")?.value as string;
  const userId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Ensure the URL is valid
    if (!((await play.validate(url)) === "yt_video")) {
      await interaction.followUp({
        content: "Invalid YouTube URL.",
        ephemeral: true,
      });
      return;
    }

    // Find or create the playlist
    let playlist = await prisma.playlist.findFirst({
      where: { name: playlistName, userId: userId },
    });

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          name: playlistName,
          userId: userId,
        },
      });
    }

    // Add the URL to the playlist
    await prisma.video.create({
      data: {
        url: url,
        playlistId: playlist.id,
      },
    });

    await interaction.followUp({
      content: `Added ${url} to ${playlistName} playlist.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.followUp({
      content: "An error occurred while adding to the playlist.",
      ephemeral: true,
    });
  }
};

export default { data, execute } as Command;
