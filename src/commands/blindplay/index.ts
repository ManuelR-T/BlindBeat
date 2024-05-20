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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Interaction,
  StringSelectMenuBuilder,
} from "discord.js";
import play from "play-dl";
import { logger } from "utils";

import { Command } from "@/types";
import { randomInt } from "crypto";

const data = new SlashCommandBuilder()
  .setName("blindplay")
  .setDescription("Play music from a URL or search on YouTube")
  .addStringOption((option) =>
    option
      .setName("source")
      .setDescription("YouTube URL, or search terms for YouTube")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("duration")
      .setDescription("Duration of the song in seconds (default: 30)")
      .setRequired(false)
  );

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const source = interaction.options.get("source")?.value as string;
  const duration = (interaction.options.get("duration")?.value as number) || 30;
  let videoUrl: string | undefined;

  await interaction.deferReply();
  if ((await play.validate(source)) === "yt_video") {
    videoUrl = source;
  } else {
    const searchResults = await play.search(source, {
      limit: 1,
      source: { youtube: "video" },
    });
    if (
      searchResults != undefined &&
      searchResults.length > 0 &&
      searchResults[0].url != undefined
    ) {
      videoUrl = searchResults[0].url;
    } else {
      await interaction.followUp({
        content: "No video found for the provided input.",
        ephemeral: true,
      });
      return;
    }
  }

  const member = interaction.member as GuildMember;
  const channel = member.voice.channel as VoiceChannel;
  if (!channel) {
    await interaction.followUp({
      content: "You need to be in a voice channel to play music",
      ephemeral: true,
    });
    return;
  }

  if (!channel.joinable) {
    await interaction.followUp({
      content: "I don't have permission to join that voice channel",
      ephemeral: true,
    });
    return;
  }
  if (!channel.speakable) {
    await interaction.followUp({
      content: "I don't have permission to speak in that voice channel",
      ephemeral: true,
    });
    return;
  }
  if (!videoUrl) {
    await interaction.followUp({
      content: "No video found for the provided input.",
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
        try {
          connection.destroy();
        } catch (error) {
          logger.error(error);
        }
      }
    }, 60000);
  });
  player.on("error", (error) => {
    logger.error(`Error: ${error.message}`);
    connection.destroy();
  });

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guildId!,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  connection.on("error", (error) => {
    logger.error(`Error: ${error.message}`);
    connection.destroy();
  });

  if (!connection) {
    await interaction.followUp({
      content: "Failed to join the voice channel",
      ephemeral: true,
    });
    return;
  }

  connection.subscribe(player);
  player.play(resource);

  const rowPlayer = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("reveal_song")
      .setLabel("Reveal Song")
      .setEmoji("👁️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("guess_song")
      .setLabel("Guess Song")
      .setEmoji("🤔")
      .setStyle(ButtonStyle.Secondary)
  );

  const endTime = Math.floor((Date.now() + (duration + 1) * 1000) / 1000);
  const embedMessage = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("Guess the Song " + (randomInt(0, 1) == 1 ? "🎵" : "🎶"))
    .setDescription(
      `Try to guess the song or reveal its name!\n Ends <t:${endTime}:R>`
    );

  const message = await interaction.followUp({
    embeds: [embedMessage],
    components: [rowPlayer],
  });

  const filter = (i: any) => ["reveal_song", "guess_song"].includes(i.customId);
  const collector = message.createMessageComponentCollector({
    filter,
    time: (duration + 60) * 1000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "reveal_song") {
      if (i.user !== interaction.user) {
        await i.reply({
          content: "Only the command issuer can reveal the song.",
          ephemeral: true,
        });
        return;
      }
      const members = channel.members.filter((m) => !m.user.bot);
      const options = members.map((m) => ({
        label: m.user.username,
        description: m.user.tag,
        value: m.id,
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("winner_select")
        .setPlaceholder("Select the winner or 'none'")
        .addOptions([
          {
            label: "None",
            description: "No one guessed correctly",
            value: "none",
          },
          ...options,
        ]);

      const selectMenuRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          selectMenu
        );

      await i.reply({
        content: "Select the winner from the list below:",
        components: [selectMenuRow],
        ephemeral: true,
      });
    } else if (i.customId === "guess_song") {
      const guessModal = new ModalBuilder()
        .setCustomId("guess_modal")
        .setTitle("Guess the Song")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("song_guess")
              .setLabel("Your Guess")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter the song name")
              .setRequired(true)
          )
        );

      await i.showModal(guessModal);
    }
  });

  collector.on("end", async () => {
    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("reveal_song")
        .setLabel("Reveal Song")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("guess_song")
        .setLabel("Guess Song")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await message.edit({
      components: [disabledRow],
    });
  });

  interaction.client.on(
    "interactionCreate",
    async (modalInteraction: Interaction) => {
      if (!modalInteraction.isModalSubmit()) return;

      if (modalInteraction.customId === "reveal_modal") {
        const selectedWinner =
          modalInteraction.fields.getTextInputValue("winner_id");
        let winnerMessage =
          "No one guessed the song correctly. Better luck next time!";
        let winnerAvatarUrl: string | null = null;
        if (selectedWinner !== "none") {
          try {
            const winner =
              await interaction.guild?.members.fetch(selectedWinner);
            winnerMessage = `Congratulations to ${winner?.user.tag} for guessing the song correctly!`;
            if (winner) winnerAvatarUrl = winner.user.displayAvatarURL();
          } catch (error) {
            console.error(error);
          }
        }

        player.stop();

        const videoInfo = await play.video_info(videoUrl!);
        const thumbnailUrl = videoInfo.video_details.thumbnails[0].url;

        const revealEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Song Reveal")
          .setDescription(
            `Now playing: [${videoInfo.video_details.title}](${videoUrl})\n${winnerMessage}`
          )
          .setThumbnail(thumbnailUrl);

        if (winnerAvatarUrl !== null) {
          revealEmbed.setImage(winnerAvatarUrl);
        }

        await modalInteraction.deferReply();
        await modalInteraction.followUp({
          embeds: [revealEmbed],
        });

        collector.stop();
      } else if (modalInteraction.customId === "guess_modal") {
        const guess = modalInteraction.fields.getTextInputValue("song_guess");
        try {
          await modalInteraction.reply({
            content: `Your guess has been sent!`,
            ephemeral: true,
          });
        } catch (error) {
          logger.error(error);
        }
        const commandIssuer = await interaction.client.users.fetch(
          interaction.user.id
        );

        const videoInfo = await play.video_info(videoUrl!);

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Song Guess")
          .setDescription(
            `A user guessed the song! \n\nRight answer: ${videoInfo.video_details.title} \n\n ${message.url}`
          )
          .addFields(
            {
              name: "Guessed by",
              value: modalInteraction.user.tag,
              inline: true,
            },
            { name: "Guess", value: guess, inline: true }
          )
          .setThumbnail(modalInteraction.user.displayAvatarURL());

        await commandIssuer.send({ embeds: [embed] });
      }
    }
  );

  interaction.client.on(
    "interactionCreate",
    async (selectInteraction: Interaction) => {
      if (!selectInteraction.isStringSelectMenu()) return;

      if (selectInteraction.customId === "winner_select") {
        const selectedWinner = selectInteraction.values[0];
        let winnerMessage =
          "No one guessed the song correctly. Better luck next time!";
        let winnerAvatarUrl: string | null = null;
        if (selectedWinner !== "none") {
          try {
            const winner =
              await interaction.guild?.members.fetch(selectedWinner);
            winnerMessage = `Congratulations to ${winner?.user} for guessing the song correctly!`;
            if (winner) {
              winnerAvatarUrl = winner.user.displayAvatarURL();
            }
          } catch (error) {
            console.error(error);
          }
        }

        player.stop();
        const videoInfo = await play.video_info(videoUrl!);
        const thumbnailUrl = videoInfo.video_details.thumbnails[0].url;

        const revealEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Song Reveal:" + " " + videoInfo.video_details.title)
          .setDescription(
            `Now playing: [${videoInfo.video_details.title}](${videoUrl})\n${winnerMessage} \n\n[Click here to view it on yt](${videoUrl})`
          )
          .setImage(thumbnailUrl);

        if (winnerAvatarUrl) {
          revealEmbed.setThumbnail(winnerAvatarUrl);
        }

        try {
          await selectInteraction.deferUpdate();
          await selectInteraction.followUp({
            embeds: [revealEmbed],
            components: [],
          });
        } catch (error) {
          logger.error(error);
        }

        collector.stop();
      }
    }
  );

  setTimeout(() => {
    player.stop();
  }, duration * 1000);
};

export default { data, execute } as Command;
