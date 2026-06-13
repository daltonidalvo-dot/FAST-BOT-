import fs from "fs";

const file = "./Database/ranking.json";

// garante que pasta e arquivo existem
if (!fs.existsSync("./Database")) {
  fs.mkdirSync("./Database");
}

if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({}, null, 2));
}

export function getRankingDB() {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    return {};
  }
}

export function saveRankingDB(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}