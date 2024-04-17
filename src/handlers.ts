import { Collection, Events } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { logger } from 'utils'

import { MyClient } from './types'

export const handleEvents = async (client: MyClient): Promise<void> => {
  const dirName = __dirname
  const eventFolders = fs
    .readdirSync(path.join(dirName, 'events'))
    .filter((folder) => Object.values(Events).includes(folder as Events))
  const foldersPath = path.join(dirName, 'events')
  for (const folder of eventFolders) {
    const eventsPath = path.join(foldersPath, folder)
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file === 'index.js' || file === 'index.ts')
    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file)
      const importedModule = await import(filePath)
      const event = importedModule.default.default
      if (event.once) {
        client.once(event.name, (client, ...args) =>
          event.listener(client, ...args),
        )
      } else {
        client.on(event.name, (client, ...args) =>
          event.listener(client, ...args),
        )
      }
    }
  }
}

export const handleCommands = async (client: MyClient): Promise<void> => {
  const dirName = __dirname

  const commandFolders = fs.readdirSync(path.join(dirName, 'commands'))
  const foldersPath = path.join(dirName, 'commands')

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file === 'index.js' || file === 'index.ts')

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file)
      try {
        const importedModule = await import(filePath)
        const command = importedModule.default.default
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command)
          client.cooldowns.set(command.data.name, new Collection())
        } else {
          logger.warn(
            `The command at ${filePath} is missing a required "data" or "execute" property.`,
          )
        }
      } catch (error) {
        logger.error(`Failed to load command at ${filePath}:`, error)
      }
    }
  }
}
