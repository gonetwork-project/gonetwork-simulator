const sjcl = require('sjcl')
import { generateSecureRandom } from 'react-native-securerandom'

const addEntropy = () => generateSecureRandom(1024)
  .then((randomBytes: any) =>
    sjcl.random.addEntropy(new Uint32Array(randomBytes.buffer), 1024, 'crypto.randomBytes')
  )

addEntropy()
