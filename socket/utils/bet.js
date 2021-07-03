const User = require("../../models/User");
const Bet = require("../../models/Bet");
const WinResult = require("../../models/WinResult");
const Winning = require("../../models/Winning");
const Subper = require("../../models/Subper");
async function placeBet(retailerId, game, position, betPoint, adminPer) {
  //Verify Token
  try {

    let user = await User.findById(retailerId);
    const superDistributer = await User.findById(user.referralId);
    if (user.creditPoint >= betPoint) {
      let subAdminPer = await Subper.findById("60b74f37118f094eaa3709c2");
      subAdminPer = subAdminPer.percent;
      bet = await Bet.create({
        retailerId,
        game,
        bet: betPoint,
        startPoint: user.creditPoint,
        userName: user.userName,
        position,
        name: user.name,
        adminCommissions: (betPoint * (100 - adminPer)) / 100,
        superDistributerCommission:
          (betPoint * superDistributer.commissionPercentage) / 100,
        retailerCommission: (betPoint * user.commissionPercentage) / 100,
      });
      await User.findByIdAndUpdate(retailerId, {
        $inc: {
          creditPoint: -betPoint,
          playPoint: betPoint,
        },
        lastBetAmount: betPoint,
      });
      await User.findByIdAndUpdate(user.referralId, {
        $inc: {
          commissionPoint:
            (betPoint * superDistributer.commissionPercentage) / 100,
        },
      });
      await User.updateMany({ role: "subAdmin" }, {
        $inc: {
          commissionPoint:
            (betPoint * subAdminPer) / 100,
        },
      })
      return bet._id;
    }
    return 0;
  } catch (err) {
    console.log("Error on place bet", err.message);
    return;
  }
}

async function winGamePay(price, betId, winPosition, gameName) {
  try {
    console.log(
      "WInGame Pay: price : ",
      price,
      "  betId : ",
      betId,
      " winPosition : ",
      winPosition
    );

    const betData = await Bet.findByIdAndUpdate(betId, {
      $inc: { won: price },
    });
    let user = "";
    if (gameName == "rouletteMini")
      user = await User.findByIdAndUpdate(betData.retailerId, {
        $inc: { creditPoint: price, wonPoint: price },
      });
    else
      user = await User.findByIdAndUpdate(betData.retailerId, {
        $inc: { tripleChance: price },
      });

    return betData.retailerId;
  } catch (err) {
    console.log("Error on winGamePay", err.message);
    return err.message;
  }
}

//Add result of the Game
async function addGameResult(gameName, result) {
  try {
    await WinResult.create({ gameName, result });
    await Bet.updateMany(
      { $and: [{ game: gameName }, { winPosition: "" }] },
      { winPosition: result }
    );
  } catch (err) {
    console.log("Error on addGameResult", err.message);
    return err.message;
  }
}

//Add result of the Game
async function getLastrecord(gameName, retailerId) {
  try {
    let result = await WinResult.find({ gameName })
      .select({ result: 1, _id: 0 })
      .sort("-createdAt")
      .limit(15);
    let data = [];
    let take = 0;

    take = await User.findById(retailerId);
    for (res of result) {
      data.push(res.result);
    }

    if (gameName == "rouletteMini") return { records: data, take: 0 };
    else return { records: data, take: take[gameName] };
  } catch (err) {
    console.log("Error on getLastrecord", err.message);
    return err.message;
  }
}

async function takePoint(gameName, retailerId) {
  try {
    user = await User.findById(retailerId);
    await User.findByIdAndUpdate(retailerId, {
      $inc: { creditPoint: user[gameName], wonPoint: user[gameName] },
      [gameName]: 0,
    });
    return "balance is Updated";
  } catch (err) {
    console.log("Error on TakePoint ", err.message);
    return err.message;
  }
}

//Get Admin Percentage for winning Result
async function getAdminPer() {
  return Winning.findById("602e55e9a494988def7acc25");
}
//Get current running Game Data{
async function getCurrentBetData(gameName, retailerId) {
  let data = await Bet.find({ game: gameName, winPosition: "", retailerId });
  return data;
}

module.exports = {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  takePoint,
  getCurrentBetData,
};
