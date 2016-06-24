const fs = require("fs");
const path = require("path");

console.info("Move files from distribution");

const distributionDirPath = path.join(__dirname, "../distribution");

const rootDirPath = path.join(__dirname, "../");

const files = fs.readdirSync(distributionDirPath);
files.forEach(file => {
  console.info("Move " + file);
  fs.renameSync(path.join(distributionDirPath, file), path.join(rootDirPath, file));
});

fs.rmdirSync(distributionDirPath);

console.info("Move files from distribution done");
