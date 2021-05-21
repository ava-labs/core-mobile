import { Buffer } from 'buffer/';
/**
 * @ignore
 */
/**
 * Helper utility for encryption and password hashing, browser-safe.
 * Encryption is using AES-GCM with a random public nonce.
 */
export default class CryptoHelpers {
    protected ivSize: number;
    protected saltSize: number;
    protected tagLength: number;
    protected aesLength: number;
    keygenIterations: number;
    /**
     * Internal-intended function for cleaning passwords.
     *
     * @param password
     * @param salt
     */
    _pwcleaner(password: string, slt: Buffer): Buffer;
    /**
     * Internal-intended function for producing an intermediate key.
     *
     * @param pwkey
     */
    _keyMaterial(pwkey: Buffer): Promise<CryptoKey>;
    /**
     * Internal-intended function for turning an intermediate key into a salted key.
     *
     * @param keyMaterial
     * @param salt
     */
    _deriveKey(keyMaterial: CryptoKey, salt: Buffer): Promise<CryptoKey>;
    /**
     * A SHA256 helper function.
     *
     * @param message The message to hash
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the SHA256 hash of the message
     */
    sha256(message: string | Buffer): Buffer;
    /**
     * Generates a randomized {@link https://github.com/feross/buffer|Buffer} to be used as a salt
     */
    makeSalt(): Buffer;
    /**
     * Produces a password-safe hash.
     *
     * @param password A string for the password
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} containing a salt used in the password hash
     *
     * @returns An object containing the "salt" and the "hash" produced by this function, both as {@link https://github.com/feross/buffer|Buffer}.
     */
    pwhash(password: string, salt: Buffer): Promise<{
        salt: Buffer;
        hash: Buffer;
    }>;
    /**
     * Encrypts plaintext with the provided password using AES-GCM.
     *
     * @param password A string for the password
     * @param plaintext The plaintext to encrypt
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} for the salt to use in the encryption process
     *
     * @returns An object containing the "salt", "iv", and "ciphertext", all as {@link https://github.com/feross/buffer|Buffer}.
     */
    encrypt(password: string, plaintext: Buffer | string, salt?: Buffer | undefined): Promise<{
        salt: Buffer;
        iv: Buffer;
        ciphertext: Buffer;
    }>;
    /**
     * Decrypts ciphertext with the provided password, iv, and salt.
     *
     * @param password A string for the password
     * @param ciphertext A {@link https://github.com/feross/buffer|Buffer} for the ciphertext
     * @param salt A {@link https://github.com/feross/buffer|Buffer} for the salt
     * @param iv A {@link https://github.com/feross/buffer|Buffer} for the iv
     */
    decrypt(password: string, ciphertext: Buffer, salt: Buffer, iv: Buffer): Promise<Buffer>;
    constructor();
}
