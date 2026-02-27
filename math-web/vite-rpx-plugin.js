// Vite plugin to convert rpx to vw
export function rpxToVw() {
  return {
    name: 'rpx-to-vw',
    transform(code, id) {
      // Only process Vue and CSS files
      if (!id.endsWith('.vue') && !id.endsWith('.css') && !id.endsWith('.scss')) {
        return null
      }
      
      // Replace rpx with vw (750rpx = 100vw)
      // 1rpx = 100vw / 750 = 0.133333vw
      const rpxRegex = /(\d+(?:\.\d+)?)rpx/g
      const result = code.replace(rpxRegex, (match, num) => {
        const vw = (parseFloat(num) * 100 / 750).toFixed(5)
        return `${vw}vw`
      })
      
      return {
        code: result,
        map: null
      }
    }
  }
}
