const appointments = [];

const generateId = () =>
  `apt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const appointmentRepository = {
  create(record) {
    const item = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...record
    };
    appointments.push(item);
    return item;
  },

  findAll() {
    return [...appointments].sort((a, b) => {
      if (a.createdAt > b.createdAt) return -1;
      if (a.createdAt < b.createdAt) return 1;
      return 0;
    });
  },

  deleteById(id) {
    const idx = appointments.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    const [removed] = appointments.splice(idx, 1);
    return removed;
  }
};
