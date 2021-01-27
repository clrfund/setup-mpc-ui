"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToCeremony = void 0;
function jsonToCeremony(json) {
    // throws if ceremony is malformed
    const { lastSummaryUpdate, startTime, endTime, completedAt, participants } = json, rest = __rest(json, ["lastSummaryUpdate", "startTime", "endTime", "completedAt", "participants"]);
    //const start: firebase.firestore.Timestamp = startTime;
    //console.log(`start time ${start ? start.toDate().toLocaleDateString() : '-'}`);
    return Object.assign(Object.assign({}, rest), { lastSummaryUpdate: lastSummaryUpdate ? lastSummaryUpdate.toDate() : undefined, startTime: startTime ? startTime.toDate() : new Date(), endTime: endTime ? endTime.toDate() : undefined });
}
exports.jsonToCeremony = jsonToCeremony;
// export const jsonToContribution = (json: any): Contribution => {
//   return {
//     ...json
//   }
// }
//# sourceMappingURL=ZKPartyApi.js.map