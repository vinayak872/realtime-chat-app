const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: 'Email or username already exists' });
  }

  if (err.message === 'Unsupported file type') {
    return res.status(400).json({ message: 'Unsupported file type' });
  }

  if (err.message === 'File too large') {
    return res.status(400).json({ message: 'File size exceeds maximum limit' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
};

export default errorHandler;
