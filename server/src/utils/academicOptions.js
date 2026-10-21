export const registrationPrograms = [
  { name: "B-Tech", durationYears: 4 },
  { name: "Degree", durationYears: 3 },
  { name: "Pharmacy", durationYears: 4 },
  { name: "MTech", durationYears: 2 },
];

export function getRegistrationProgram(name) {
  return registrationPrograms.find((program) => program.name === name);
}
