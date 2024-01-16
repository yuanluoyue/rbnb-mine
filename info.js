const os = require('os')

const main = () => {
  const numCpus = os.cpus().length
  console.log(`cpu 核数 ${numCpus}`)
}

main()
