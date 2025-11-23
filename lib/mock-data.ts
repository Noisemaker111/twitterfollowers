export type UserStatus = "Following" | "Follower" | "Blocked"

export type Follower = {
  rank: number
  handle: string
  country: string
  joinedDate: string // YYYY-MM-DD
  status: UserStatus
  avatar?: string
}

// Helper to generate random date
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0]
}

export const yacineFollowers: Follower[] = [
  { rank: 1, handle: "@eurofounder", country: "Poland", joinedDate: "2018-03-12", status: "Follower" },
  { rank: 2, handle: "@priyanshukhlaAI", country: "South Asia", joinedDate: "2020-11-05", status: "Following" },
  { rank: 3, handle: "@cryptoguy", country: "Eastern Europe", joinedDate: "2019-06-23", status: "Follower" },
  { rank: 4, handle: "@beckyinabucket", country: "India", joinedDate: "2021-01-15", status: "Follower" },
  { rank: 5, handle: "@pauldams057306", country: "Viet Nam", joinedDate: "2022-08-30", status: "Blocked" },
  { rank: 6, handle: "@Jimmy-Ships", country: "India", joinedDate: "2017-05-20", status: "Follower" },
  { rank: 7, handle: "@coinflappergame", country: "United Kingdom", joinedDate: "2019-12-11", status: "Following" },
  { rank: 8, handle: "@panicanfinder69", country: "Canada", joinedDate: "2023-02-14", status: "Blocked" },
  { rank: 9, handle: "@Narrativendia", country: "India", joinedDate: "2020-04-01", status: "Follower" },
  { rank: 10, handle: "@NanoBanana", country: "United States", joinedDate: "2016-09-15", status: "Following" },
  { rank: 11, handle: "@MCAnonValue", country: "Mexico", joinedDate: "2021-07-22", status: "Follower" },
  { rank: 12, handle: "@Hasnan2Hustle", country: "Pakistan", joinedDate: "2022-03-10", status: "Follower" },
  { rank: 13, handle: "@damnanuj", country: "India", joinedDate: "2019-08-05", status: "Follower" },
  { rank: 14, handle: "@e-plan4", country: "Not Verified", joinedDate: "2020-12-12", status: "Blocked" },
  { rank: 15, handle: "@usLootfi", country: "Indonesia", joinedDate: "2021-05-30", status: "Follower" },
  { rank: 16, handle: "@xkevin_le", country: "United States", joinedDate: "2018-11-20", status: "Following" },
  { rank: 17, handle: "@vagus.ai", country: "Czech Republic", joinedDate: "2022-10-01", status: "Follower" },
  { rank: 18, handle: "@samuel_ezh", country: "Nigeria", joinedDate: "2020-02-28", status: "Follower" },
  { rank: 19, handle: "@user298359384", country: "United States", joinedDate: "2023-01-15", status: "Blocked" },
  { rank: 20, handle: "@executor", country: "Africa", joinedDate: "2019-04-10", status: "Follower" },
  { rank: 21, handle: "@Adait", country: "United Kingdom", joinedDate: "2018-01-20", status: "Following" },
  { rank: 22, handle: "@oog84_", country: "India", joinedDate: "2021-09-15", status: "Follower" },
  { rank: 23, handle: "@wlthintern", country: "United States", joinedDate: "2022-11-02", status: "Following" },
  { rank: 24, handle: "@trendradar_app", country: "Israel", joinedDate: "2020-06-18", status: "Follower" },
  { rank: 25, handle: "@axolonbase", country: "Turkey", joinedDate: "2019-03-25", status: "Follower" },
  { rank: 26, handle: "@AskPolymarket", country: "United States", joinedDate: "2023-04-10", status: "Following" },
  { rank: 27, handle: "@petergostev", country: "United States", joinedDate: "2017-08-12", status: "Follower" },
  { rank: 28, handle: "@NimavtMan", country: "Canada", joinedDate: "2021-02-28", status: "Follower" },
  { rank: 29, handle: "@Reljuu", country: "Serbia", joinedDate: "2022-05-05", status: "Blocked" },
  { rank: 30, handle: "@CaravanWD", country: "Canada", joinedDate: "2019-10-20", status: "Follower" },
  { rank: 31, handle: "@thebetter_world", country: "India", joinedDate: "2020-08-14", status: "Follower" },
  { rank: 32, handle: "@TryLapis", country: "United States", joinedDate: "2021-12-01", status: "Following" },
  { rank: 33, handle: "@SopranosTech", country: "United States", joinedDate: "2018-06-30", status: "Follower" },
  { rank: 34, handle: "@ventuals", country: "United States", joinedDate: "2022-09-22", status: "Follower" },
  { rank: 35, handle: "@pukusute1976", country: "United States", joinedDate: "2019-01-05", status: "Follower" },
  { rank: 36, handle: "@praetorsoft", country: "Turkey", joinedDate: "2020-03-18", status: "Follower" },
  { rank: 37, handle: "@fat pepe coin", country: "United States", joinedDate: "2023-05-12", status: "Blocked" },
  { rank: 38, handle: "@FlipOnSol", country: "United States", joinedDate: "2021-04-20", status: "Follower" },
  { rank: 39, handle: "@anoncoin", country: "South Asia", joinedDate: "2022-01-30", status: "Follower" },
  { rank: 40, handle: "@T_Way1", country: "United Kingdom", joinedDate: "2019-07-15", status: "Following" },
  { rank: 41, handle: "@VoltrexAI", country: "Hungary", joinedDate: "2020-10-08", status: "Follower" },
  { rank: 42, handle: "@ApexOrch", country: "Norway", joinedDate: "2018-09-25", status: "Follower" },
  { rank: 43, handle: "@xdeequant", country: "Europe", joinedDate: "2021-06-12", status: "Following" },
  { rank: 44, handle: "@mogpf", country: "Europe", joinedDate: "2022-02-18", status: "Blocked" },
  { rank: 45, handle: "@partyhatsclub", country: "United States", joinedDate: "2019-11-30", status: "Follower" },
  { rank: 46, handle: "@gitjiggywithit", country: "United Kingdom", joinedDate: "2020-05-25", status: "Following" },
  { rank: 47, handle: "@ABDMorok25", country: "Algeria", joinedDate: "2021-08-10", status: "Follower" },
  { rank: 48, handle: "@launchcoin", country: "United States", joinedDate: "2023-03-05", status: "Follower" },
  { rank: 49, handle: "@kurdishvine", country: "Iraq", joinedDate: "2019-02-14", status: "Follower" },
  { rank: 50, handle: "@Bejay hub", country: "Nigeria", joinedDate: "2022-07-20", status: "Follower" },
]
