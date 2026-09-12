import Student from "@/models/Student";
import { setSequence, STUDENT_ID_SEQ_START } from "@/models/Counter";

/**
 * Compact studentId values to a consecutive sequence starting at 1001,
 * in createdAt order. Also resets the studentId counter so the next
 * new student gets the next number.
 */
export async function resequenceStudentIds(): Promise<void> {
  const students = await Student.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select("_id")
    .lean();

  if (students.length === 0) {
    await setSequence("studentId", STUDENT_ID_SEQ_START);
    return;
  }

  await Student.bulkWrite(
    students.map((student) => ({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: { studentId: `__tmp_${String(student._id)}` } },
      },
    }))
  );

  await Student.bulkWrite(
    students.map((student, index) => ({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: { studentId: String(STUDENT_ID_SEQ_START + 1 + index) } },
      },
    }))
  );

  await setSequence("studentId", STUDENT_ID_SEQ_START + students.length);
}
