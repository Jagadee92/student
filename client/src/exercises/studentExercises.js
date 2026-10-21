export const sampleStudents = [
  { id: 1, name: "Asha Rao", marks: 86, department: "CSE" },
  { id: 2, name: "Kiran Kumar", marks: 72, department: "Civil" },
  { id: 3, name: "Meera Das", marks: 93, department: "CSE" },
  { id: 4, name: "Rahul Singh", marks: 54, department: "ECE" },
];

export function filterByMarks(students, minMarks) {
  return students.filter((student) => student.marks >= minMarks);
}

export function findStudent(students, studentId) {
  return students.find((student) => student.id === studentId) ?? null;
}

export function getAverage(students) {
  if (students.length === 0) return 0;
  const total = students.reduce(
    (total, student) => total + student.marks,
    0,
  );
  return Number((total / students.length).toFixed(2));
}

export function sortByName(students) {
  return [...students].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function getNames(students) {
  return students.map(({ id, name }) => ({ id, displayName: name }));
}

export function hasPassed(students, pass = 40) {
  return students.some((student) => student.marks >= pass);
}

export function groupByDepartment(students) {
  return students.reduce((groups, student) => {
    const department = student.department ?? "Department not selected";
    groups[department] = [...(groups[department] ?? []), student];
    return groups;
  }, {});
}

export function combineLists(...lists) {
  return lists.flat();
}

export async function getStudents(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const students = await response.json();
    return { data: students, error: null, loading: false };
  } catch (error) {
    return { data: [], error: error.message, loading: false };
  }
}

export function formatStudent(student) {
  return JSON.stringify(student);
}

export function readStudent(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export function getDepartment(student) {
  return student.department?.name ?? "No department selected";
}
