import RNFS from 'react-native-fs'

class SnapshotService {
  getPath(filename: string): string {
    return `${RNFS.DocumentDirectoryPath}/${filename}`
  }

  async saveAs(tempPath: string, filename: string): Promise<void> {
    const snapshotPath = this.getPath(filename)

    const fileExists = await RNFS.exists(snapshotPath)
    if (fileExists) {
      await RNFS.unlink(snapshotPath)
    }

    await RNFS.copyFile(tempPath, snapshotPath)
  }

  async delete(filename: string): Promise<void> {
    const snapshotPath = this.getPath(filename)

    const fileExists = await RNFS.exists(snapshotPath)
    if (fileExists) {
      await RNFS.unlink(snapshotPath)
    }
  }
}

export default new SnapshotService()
