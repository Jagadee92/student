export const commonBranches = [
  "CSE",
  "ECE",
  "Civil",
  "EEE",
  "AI & ML",
  "AI & Data Science",
  "AIML",
  "AIDS",
  "Mechanical",
  "Information Technology",
  "Chemical",
  "Biotechnology",
  "Agriculture",
  "Others",
];

export const studyPrograms = [
  { name: "B-Tech", durationYears: 4 },
  { name: "Degree", durationYears: 3 },
  { name: "Pharmacy", durationYears: 4 },
  { name: "MTech", durationYears: 2 },
];

export function getEstimatedPassingOutYear(
  yearOfStudy,
  durationYears,
  currentYear = new Date().getFullYear(),
) {
  const studyYear = Number(yearOfStudy);
  if (
    !Number.isInteger(studyYear) ||
    !Number.isInteger(durationYears) ||
    studyYear < 1 ||
    durationYears < 1 ||
    studyYear > durationYears
  ) {
    return "";
  }
  return currentYear + durationYears - studyYear;
}

export function getProgramLabel(value) {
  return value || "";
}
