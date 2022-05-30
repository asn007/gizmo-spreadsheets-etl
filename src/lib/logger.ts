const debug = (...args: any[]) => {
  if (!process.env.DEBUG || !process.env.DEBUG.includes('gizmo-exporter')) return
  console.log.apply(null, ['--> DEBUG', ...args])
}
const log = (...args: any[]) => {
  console.log.apply(null, ['-> INFO', ...args])
}

const error = (...args: any) => {
  console.error.apply(null, ['-> ERROR', ...args])
}

export { debug, log, error }
