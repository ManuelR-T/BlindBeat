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
import { logger } from 'utils'

import { Command } from '@/types'

const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play music from a URL or search on YouTube for 30 seconds')
  .addStringOption((option) =>
    option
      .setName('source')
      .setDescription('YouTube URL, or search terms for YouTube')
      .setRequired(true),
  )

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const source = interaction.options.get('source')?.value as string
  let videoUrl: string | undefined

  interaction.deferReply({ ephemeral: true })
  if ((await play.validate(source)) == 'yt_video') {
    videoUrl = source
  } else {
    const searchResults = await play.search(source, {
      limit: 1,
      source: { youtube: 'video' },
    })
    if (
      searchResults != undefined &&
      searchResults.length > 0 &&
      searchResults[0].url != undefined
    ) {
      videoUrl = searchResults[0].url
    } else {
      interaction.followUp({
        content: 'No video found for the provided input.',
        ephemeral: true,
      })
      return
    }
  }

  const member = interaction.member as GuildMember
  const channel = member.voice.channel as VoiceChannel
  if (!channel) {
    interaction.followUp({
      content: 'You need to be in a voice channel to play music',
      ephemeral: true,
    })
    return
  }

  if (!channel.joinable) {
    interaction.followUp({
      content: "I don't have permission to join that voice channel",
      ephemeral: true,
    })
    return
  }
  if (!channel.speakable) {
    interaction.followUp({
      content: "I don't have permission to speak in that voice channel",
      ephemeral: true,
    })
    return
  }
  if (!videoUrl) {
    interaction.followUp({
      content: 'No video found for the provided input.',
      ephemeral: true,
    })
    return
  }
  const stream = await play.stream(videoUrl)
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  })

  const player = createAudioPlayer()
  player.on(AudioPlayerStatus.Idle, () => {
    setTimeout(() => {
      if (player.state.status === AudioPlayerStatus.Idle) {
        connection.destroy()
      }
    }, 60000)
  })
  player.on('error', (error) => {
    logger.error(`Error: ${error.message}`)
    connection.destroy()
  })

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guildId!,
    adapterCreator: channel.guild.voiceAdapterCreator,
  })
  connection.on('error', (error) => {
    logger.error(`Error: ${error.message}`)
    connection.destroy()
  })

  if (!connection) {
    interaction.followUp({
      content: 'Failed to join the voice channel',
      ephemeral: true,
    })
    return
  }

  connection.subscribe(player)

  player.play(resource)
  interaction.followUp({
    content: `Now playing: ${videoUrl}`,
    ephemeral: true,
  })

  //   const rowPlayer = new ActionRowBuilder<ButtonBuilder>().addComponents(
  //     new ButtonBuilder()
  //       .setCustomId("controlPanel")
  //       .setLabel(`Play/Pause`)
  //       .setEmoji("⏯️")
  //       .setStyle(ButtonStyle.Secondary)
  //   );
  //   const message = await interaction.followUp({content: "Control Panel", ephemeral: false, components: [rowPlayer]})

  //   const collector = message.createMessageComponentCollector({time: 60000})

  //   collector.on("collect", async (i) => {
  //     if (i.customId == "Play/Pause") {
  //       if (player.state.status === AudioPlayerStatus.Playing)
  //         player.pause()
  //       else if (player.state.status === AudioPlayerStatus.Paused)
  //         player.unpause()
  //     }
  //   })

  //   collector.on("end", async () => {
  //     rowPlayer.components[0].setDisabled(true);
  //     await message.edit({
  //       components: [rowPlayer],
  //     });
  //   });
}

export default { data, execute } as Command
