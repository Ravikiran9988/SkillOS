const studentRepo = require('../repositories/studentRepository');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Log in as a student by email, studentId, or credentials.
 */
async function login(req, res, next) {
  try {
    const { email, studentId } = req.body;

    let student = null;

    if (studentId) {
      student = await studentRepo.getStudentById(studentId);
    } else if (email) {
      const allStudents = await studentRepo.getAllStudents();
      student = allStudents.find(
        (s) => s.email?.toLowerCase() === email.trim().toLowerCase()
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Please provide either an email or studentId to log in.',
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'No student account found with the provided credentials.',
      });
    }

    const token = generateToken(student);

    res.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        educationLevel: student.educationLevel,
        targetCareer: student.targetCareer,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 * Register a new student account and create their Person graph node.
 */
async function register(req, res, next) {
  try {
    const { name, email, educationLevel } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Name and email are required to register.',
      });
    }

    const newStudent = await studentRepo.createStudent({
      name: name.trim(),
      email: email.trim(),
      educationLevel: educationLevel || "Bachelor's",
    });

    const token = generateToken(newStudent);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to SkillOS!',
      token,
      student: newStudent,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Fetch the currently authenticated student's full profile.
 */
async function getMe(req, res, next) {
  try {
    const student = await studentRepo.getStudentById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'Authenticated student profile not found in database.',
      });
    }

    res.json({
      success: true,
      student,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/demo-students
 * Return public preview list of seeded student personas for 1-click evaluator login.
 */
async function getDemoStudents(req, res, next) {
  try {
    const students = await studentRepo.getAllStudents();
    const previews = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      educationLevel: s.educationLevel,
      targetCareer: s.targetCareer,
      skillCount: s.skillCount,
    }));

    res.json({
      success: true,
      students: previews,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  login,
  register,
  getMe,
  getDemoStudents,
  logout,
};
