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
import ytdl from 'ytdl-core'
import ytsr from 'ytsr'

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
  const source = interaction.options.get('source')?.value as string

  let videoUrl: string | undefined

  if (ytdl.validateURL(source)) {
    videoUrl = source
  } else {
    const searchResults = await ytsr(source, { limit: 1 })
    if (
      searchResults.items.length > 0 &&
      searchResults.items[0].type === 'video'
    ) {
      videoUrl = searchResults.items[0].url
    } else {
      interaction.reply({
        content: 'No video found for the provided input.',
        ephemeral: true,
      })
      return
    }
  }

  const member = interaction.member as GuildMember
  const channel = member.voice.channel as VoiceChannel
  if (!channel) {
    interaction.reply({
      content: 'You need to be in a voice channel to play music',
      ephemeral: true,
    })
    return
  }

  const stream = ytdl(videoUrl, { filter: 'audioonly' })
  const resource = createAudioResource(stream)

  const player = createAudioPlayer()
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guildId!,
    adapterCreator: channel.guild.voiceAdapterCreator,
  })

  connection.subscribe(player)
  player.play(resource)
  player.on(AudioPlayerStatus.Playing, () => {
    interaction.reply({ content: `Now playing: ${videoUrl}`, ephemeral: true })
  })

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy()
  })
}

export default { data, execute } as Command
