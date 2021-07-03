const { io } = require("../server");
const { getUserInfoBytoken } = require("./utils/users");
const {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
} = require("./utils/bet");
const immutable = require("object-path-immutable");
var _ = require("lodash");
let games = {
  parity: {
    startTime: new Date().getTime() / 1000,
    position: {},
  },
  fastParity: {
    startTime: new Date().getTime() / 1000 + 10,
    position: {},
  },
  dice: {
    startTime: new Date().getTime() / 1000 + 10,
    position: {},
  },
  andarBahar: {
    startTime: new Date().getTime() / 1000 + 10,
    position: {},
  },
};



//users: use for store game Name so when user leave room than we can used
let users = {};
//used for when he won the match
let retailers = {};
//TransactionId
let transactions = {};

let adminPer = 50;
io.on("connection", (socket) => {
  //Join Event When Application is Start
  socket.on("join", async ({ token, gameName }) => {
    let user = await getUserInfoBytoken(token);
    //Log Out other User
    if (retailers[user._id] != socket.id) {
      io.to(retailers[user._id]).emit("res", {
        data: "Some one use your Id to other device",
        en: "logout",
        status: 1,
      });
    }
    let numbers = await getLastrecord(gameName, user._id);
    let gameData = await getCurrentBetData(gameName, user._id);
    users[socket.id] = gameName;
    retailers[user._id] = socket.id;
    socket.join(gameName);
    socket.emit("res", {
      data: {
        user,
        time: new Date().getTime() / 1000 - games[gameName].startTime,
        numbers: numbers.records,
        take: numbers.take,
        gameName,
        gameData,
      },
      en: "join",
      status: 1,
    });
  });

  socket.on(
    "placeBet",
    async ({ retailerId, gameName, position, betPoint, position2 }) => {
      const result = await placeBet(
        retailerId,
        gameName,
        position,
        betPoint,
        adminPer
      );
      console.log(
        gameName,
        "  :  ",
        position,
        " Bet Point :  ",
        betPoint,
        position2
      );
      if (result != 0) {
        if (gameName == "rouletteMini") playCasino(gameName, position, result);
        else if (gameName == "tripleChance") playTripleChance(position, result);

        console.log(
          "Viju vinod Chopda before : ",
          games.rouletteMini.adminBalance,
          games[gameName].adminBalance
        );

        if (betPoint)
          games[gameName].adminBalance += (betPoint * adminPer) / 100;

        console.log(
          "Viju vinod Chopda Admin balance is: ",
          games[gameName].adminBalance
        );
      }
    }
  );
  socket.on("takeMoney", async ({ retailerId, gameName }) => {
    let data = await takePoint(gameName, retailerId);
    socket.emit("res", {
      data,
      gameName,
      en: "takeMoney",
      status: 1,
    });
  });

  socket.on("leaveRoom", ({ gameName, userId }) => {
    socket.leave(gameName);
    delete users[socket.id];

    delete retailers[userId];
  });

  //Disconnect the users
  socket.on("disconnect", () => {
    socket.leave(users[socket.id]);
    delete users[socket.id];
    for (userId in retailers) {
      if (retailers[userId] == socket.id) delete retailers[userId];
    }
  });

  socket.on("beep", () => {
    socket.emit("boop", {
      data: {},
      status: 1,
    });
  });
});

setInterval(async () => {
  // if (new Date().getHours() > 7 && new Date().getHours() < 22) {

  if (new Date().getTime() / 1000 > games.rouletteMini.startTime + 60) {
    getResult("rouletteMini", 36);
  }

  if (new Date().getTime() / 1000 > games.tripleChance.startTime + 120) {
    getResult("tripleChance", 999);
  }

  //Get Admin Percentage
  if (new Date().getMinutes() == 1) {
    let p = await getAdminPer();

    adminPer = parseInt(p.percent);
  }

  //}
}, 1000);

getResult = async (gameName, stopNum) => {
  let result = "";
  let sortResult;
  games[gameName].startTime = new Date().getTime() / 1000;

  if (Object.keys(games[gameName].position).length != undefined) {
    console.log(gameName, "Solo    Before : ", games[gameName].position);
    sortResult = sortObject(games[gameName].position);
    console.log(gameName, "After : ", sortResult);
    for (num of sortResult) {
      let value = Object.values(num)[0];
      let key = Object.keys(num)[0];
      console.log("key : ", key, "value : ", value, " adminBalanced", games[gameName].adminBalance);
      if (value < games[gameName].adminBalance) {
        result = key;
      }
      if (value > games[gameName].adminBalance) {
        break;
      }
    }
  }
  console.log("Final Result is : ", result);
  if (result == "") {
    result = Math.round(Math.random() * stopNum);
    if (gameName == "tripleChance") {
      result = result.toString();
      if (result.toString().length == 2) result = "0" + result.toString();
      else if (result.toString().length == 1) result = "00" + result.toString();
    }
  }

  let counter = 0;
  if (games[gameName].position[result])
    while (games[gameName].adminBalance < games[gameName].position[result]) {
      result = Math.round(Math.random() * stopNum);
      counter++;
      if (gameName == "tripleChance") {
        if (result.toString().length == 2) {
          result = "0" + result.toString();
        } else if (result.toString().length == 1) {
          result = "00" + result.toString();
        }
      }
      if (counter == 100) {
        result = Object.keys(sortResult[0])[0];
        break;
      }
    }

  io.in(gameName).emit("res", {
    data: {
      gameName,
      data: result,
    },
    en: "result",
    status: 1,
  });

  if (games[gameName].position[result])
    games[gameName].adminBalance -= games[gameName].position[result];

  await addGameResult(gameName, result);

  await payTransaction(gameName, result);

  flushAll(gameName);
};

payTransaction = async (gameName, result) => {
  console.log(
    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
    gameName,
    result,
    transactions[gameName]
  );
  if (transactions[gameName])
    if (transactions[gameName][result]) {
      for (let transId in transactions[gameName][result]) {
        console.log(
          "Result Price is :",
          transactions[gameName][result][transId]
        );
        let userId = await winGamePay(
          transactions[gameName][result][transId],
          transId,
          result,
          gameName
        );
        io.to(retailers[userId]).emit("res", {
          data: {
            gameName,
            data: { winAmount: transactions[gameName][result][transId] },
          },
          en: "winner",
          status: 1,
        });
      }
    }
};

sortObject = (entry) => {
  const sortKeysBy = function (obj, comparator) {
    var keys = _.sortBy(_.keys(obj), function (key) {
      return comparator ? comparator(obj[key], key) : key;
    });
    console.log(keys);
    return _.map(keys, function (key) {
      return { [key]: obj[key] };
    });
  };

  const sortable = sortKeysBy(entry, function (value, key) {
    return value;
  });

  return sortable;
};

flushAll = (gameName) => {
  games[gameName].position = {};
  transactions[gameName] = {};
};

playCasino = (gameName, position, result) => {
  for (pos of position) {
    for (num of pos[Object.keys(pos)[0]]) {
      let wonAmount = (pos.amount * 36) / pos[Object.keys(pos)[0]].length;
      games[gameName].position = immutable.update(
        games[gameName].position,
        [num],
        (v) => (v ? v + wonAmount : wonAmount)
      );
      transactions[gameName] = immutable.update(
        transactions[gameName],
        [num, result],
        (v) => (v ? v + wonAmount : wonAmount)
      );
    }
  }
  console.log("This is data", games);
  console.log("This is the Dtata: ", games[gameName].position);
};

playTripleChance = (position, result) => {
  for (pos in position) {
    let num = pos;
    if (pos.length == 1) {
      for (i = 0; i < 10; i++) {
        for (j = 0; j < 10; j++) {
          num = i.toString() + j.toString() + pos;
          games.tripleChance.position = immutable.update(
            games.tripleChance.position,
            [num],
            (v) => (v ? v + position[pos] * 9 : position[pos] * 9)
          );
          transactions.tripleChance = immutable.update(
            transactions.tripleChance,
            [num, result],
            (v) => (v ? v + position[pos] * 9 : position[pos] * 9)
          );
        }
      }
    } else if (pos.length == 2) {
      for (i = 0; i < 10; i++) {
        num = i.toString() + pos;
        games.tripleChance.position = immutable.update(
          games.tripleChance.position,
          [num],
          (v) => (v ? v + position[pos] * 90 : position[pos] * 90)
        );
        transactions.tripleChance = immutable.update(
          transactions.tripleChance,
          [num, result],
          (v) => (v ? v + position[pos] * 90 : position[pos] * 90)
        );
      }
    } else if (pos.length == 3) {
      games.tripleChance.position = immutable.update(
        games.tripleChance.position,
        [num],
        (v) => (v ? v + position[pos] * 900 : position[pos] * 900)
      );
      transactions.tripleChance = immutable.update(
        transactions.tripleChance,
        [num, result],
        (v) => (v ? v + position[pos] * 900 : position[pos] * 900)
      );
    }
  }
};
