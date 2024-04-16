import { joinVoiceChannel } from '@discordjs/voice'
import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
  VoiceChannel,
} from 'discord.js'

import { Command } from '@/types'

const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Join a voice channel')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Channel to join')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildVoice),
  )

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const channel = interaction.options.get('channel', true)
    .channel as VoiceChannel
  const guildId = channel.guildId
  const adapterCreator = channel.guild.voiceAdapterCreator

  joinVoiceChannel({
    channelId: channel.id,
    guildId,
    adapterCreator,
  })

  interaction.reply({
    content: `Joining Channel #${channel.id}`,
    ephemeral: true,
  })
}

export default { data, execute } as Command
