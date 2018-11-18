/*const alphabet = ("abcdefghijklmnopqrstuvwxyz").split("");

const humanList = [];

for (let i = 0; i < 10; i++) {
    let name = "";
    for (let i = 0; i < 5; i++) {
        let dice = Math.floor(Math.random() * 26)
        name = name + alphabet[dice];
    }

    let surname = "";
    for (let i = 0; i < 10; i++) {
        let dice = Math.floor(Math.random() * 26)
        surname = surname + alphabet[dice];
    }

    const human = {
        name: name,
        surname: surname,
        monthArrived: Math.floor(Math.random() * 12 + 1),
        dayArrived: Math.floor(Math.random() * 30 + 1),
        monthLeft: Math.floor(Math.random() * 12 + 1),
        dayLeft: Math.floor(Math.random() * 30 + 1),
        pricePerDay: Math.floor(Math.random() * 30 + 1)

    }
    humanList.push(human);
}

let guestList = [];

for (const human of humanList) {
    let monthsTaken = 0;
    let daysTaken = 0;
    let totalDaysTaken = 0;

    if (human.monthArrived < human.monthLeft) {
        monthsTaken = human.monthLeft - human.monthArrived;
    } else {
        monthsTaken = 12 - human.monthArrived + human.monthLeft;
    }

    totalDaysTaken += monthsTaken * 30;

    if (human.dayArrived < human.dayLeft) {
        daysTaken = human.dayLeft - human.dayArrived;
    } else {
        daysTaken = 30 - human.dayArrived + human.dayLeft;
    }

    totalDaysTaken += daysTaken;

    console.log("___________")
    console.log("atvyko: " + human.monthArrived + " / " + human.dayArrived);
    console.log("atvyko: " + human.monthLeft + " / " + human.dayLeft);
    console.log("Kainavo per diena: " + human.pricePerDay);
    console.log("Uztruko " + monthsTaken + " menesiu ir " + daysTaken + " dienu");
    console.log("___________")

    const guest = {
        name: human.name,
        surname: human.surname,
        dateArrived: human.monthArrived + " / " + human.dayArrived,
        timeTaken: totalDaysTaken,
        moneyPaid: totalDaysTaken * human.pricePerDay
    }
    guestList.push(guest);
}

for (const guest of guestList) {
    console.log("___________")
    console.log(guest.name)
    console.log(guest.surname)
    console.log("Diena atvyko: " + guest.dateArrived)
    console.log("Dienu uztruko: " + guest.timeTaken)
    console.log("Sumokejo: " + guest.moneyPaid)
    console.log("___________")
}*/

let totalCars = 3
let startingFormation = [1, 2, 3]
let cars = []

for (let i = 0; i < startingFormation.length; i++) {
    let car = {
        identifier: startingFormation[i],
        currentPosition: i
    }
    cars.push(car)
}

let overtakes = [[3, 2], [3, 1], [2,1]]
let ovartakesCount = 3

for (const overtake of overtakes) {
    let carOvertaking = cars.find(car => car.identifier === overtake[0])
    const carOvertakingIndex = cars.indexOf(carOvertaking)
    let carOvertook = cars.find(car => car.identifier === overtake[1])
    const carOvertookIndex = cars.indexOf(carOvertook)

    if (carOvertaking.currentPosition > carOvertook.currentPosition) {
        cars[carOvertakingIndex].currentPosition -= 1
        cars[carOvertookIndex].currentPosition += 1
        console.log("legal overtake")
    } else {
        return console.log("Can't happen")
    }
}

console.log(cars)
cars.sort(function sort(a, b) {
    if (a.currentPosition > b.currentPosition) {
        return 1
    } else if (a.currentPosition < b.currentPosition) {
        return -1
    }

    return 0;
})
console.log(cars)


let endingFormationString = ""

for (const car of cars) {
    endingFormationString = endingFormationString + car.identifier + " "
}

console.log(endingFormationString)

//3 //total cars 
//1 2 3 //the formation in which cars start, first one is the 0th element
//3 //total overtakes
//3 2 //first overtake 
//3 1 //second overtake
//2 1 //third overtake

//could this have happened?