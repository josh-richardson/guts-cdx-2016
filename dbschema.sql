BEGIN TRANSACTION;
CREATE TABLE "users" (
	`ID`	INTEGER,
	`username`	TEXT,
	`passwordHash`	TEXT,
	PRIMARY KEY(ID)
);
CREATE TABLE `admins` (
	`userID`	INTEGER,
	PRIMARY KEY(userID)
);
CREATE TABLE `accounts` (
	`accountID`	INTEGER,
	`name`	TEXT,
	`surname`	TEXT,
	`balance`	NUMERIC,
	PRIMARY KEY(accountID)
);
COMMIT;
