// Product integration for the video project (never edit the product repo).
const repo = new URL('../../prototype-v3/', import.meta.url).pathname;
export default {
  repoDir: repo,
  aliases: {'@': repo + 'src'},
  external: [],
  loaders: {'.ts': 'ts', '.tsx': 'tsx'},
  define: {},
  esbuild: {},
};
