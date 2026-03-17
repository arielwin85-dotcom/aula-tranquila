export interface Subject {
  id: string;
  name: string;
}

export const OFFICIAL_SUBJECTS: Subject[] = [
  { id: "1", name: "Lengua y Literatura" },
  { id: "2", name: "Matemática" },
  { id: "3", name: "Ciencias Naturales" },
  { id: "4", name: "Ciencias Sociales" },
  { id: "5", name: "Educación Física" },
  { id: "6", name: "Inglés" },
  { id: "7", name: "Tecnología" },
  { id: "8", name: "Música" },
  { id: "9", name: "Plástica / Artes Visuales" },
  { id: "10", name: "Formación Ética y Ciudadana" },
  { id: "11", name: "Educación Sexual Integral (ESI)" },
  { id: "12", name: "Computación / Informática" },
  { id: "13", name: "Teatro" },
  { id: "14", name: "Educación Ambiental" },
  { id: "15", name: "Construcción de Ciudadanía" },
  { id: "16", name: "Prácticas del Lenguaje" },
  { id: "17", name: "Conocimiento del Mundo" },
  { id: "18", name: "Educación Vial" },
  { id: "19", name: "Orientación y Tutoría" },
  { id: "20", name: "Educación para la Salud" },
];

export const getSubjectName = (id: string | number): string => {
  const subject = OFFICIAL_SUBJECTS.find(s => String(s.id) === String(id));
  return subject ? subject.name : "Materia Desconocida";
};
