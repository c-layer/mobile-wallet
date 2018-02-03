
// https://www.npmjs.com/package/uglify-es

module.exports = {

  /**
   * mangle: uglify 2's mangle option
   */
  mangle: {
    reserved: [ 'BigInteger', 'ECPair', 'Point' ] 
  },

  /**
   * compress: uglify 2's compress option
   */
  compress: {
    toplevel: true,
    pure_getters: true
  }
};