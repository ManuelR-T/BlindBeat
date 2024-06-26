import dotenv from 'dotenv'
dotenv.config()

export default class Config {
  private static getEnv(variable: string, defaultValue?: string): string {
    const value = process.env[variable] || defaultValue
    if (value === undefined) {
      throw new Error(
        `Env variable ${variable} is not defined and no default value provided.`,
      )
    }
    return value
  }

  static readonly TOKEN: string = Config.getEnv('TOKEN')
  static readonly CLIENT_ID: string = Config.getEnv('CLIENT_ID')
}
