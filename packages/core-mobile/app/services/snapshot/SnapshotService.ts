import RNFS from 'react-native-fs'

class SnapshotService {
  get folderPath(): string {
    return `${RNFS.DocumentDirectoryPath}/snapshots`
  }

  getPath(filename: string): string {
    return `${this.folderPath}/${filename}`
  }

  async saveAs(tempPath: string, filename: string): Promise<void> {
    const snapshotPath = this.getPath(filename)

    const folderPath = snapshotPath.substring(0, snapshotPath.lastIndexOf('/'))

    const folderExists = await RNFS.exists(folderPath)
    if (!folderExists) {
      await RNFS.mkdir(folderPath)
    }

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

  async deleteAll(): Promise<void> {
    const folderExists = await RNFS.exists(this.folderPath)
    if (folderExists) {
      await RNFS.unlink(this.folderPath)
    }
  }
}

export default new SnapshotService()
