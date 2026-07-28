import "dotenv/config";
import { buildDerivedData } from "../server/src/data/repository.js";

buildDerivedData();
console.log("Built client/public/data and copied images.");
