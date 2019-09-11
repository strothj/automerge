process.env.TEST_DIST = "1";

module.exports = {
  rootDir: "src-es",
  moduleNameMapper: {
    "dist.automerge$": "<rootDir>/../dist/automerge-es.min.js"
  }
};
