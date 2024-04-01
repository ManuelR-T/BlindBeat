import { GatewayIntentBits } from 'discord.js'

import Config from '@/config'

import { handleCommands, handleEvents } from './handlers'
import { MyClient } from './types'

const client = new MyClient({
  intents: [GatewayIntentBits.Guilds],
})

handleCommands(client)
handleEvents(client)

client.login(Config.TOKEN)
