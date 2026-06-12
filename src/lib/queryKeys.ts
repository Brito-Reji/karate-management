// centralized query key factory — model the domain hierarchy
export const queryKeys = {
  // dojos
  dojos: {
    all:    ()                         => ['dojos'],
    list:   (page, search)             => ['dojos', 'list', { page, search }],
    detail: (id)                       => ['dojos', 'detail', id],
  },

  // students
  students: {
    all:    ()                         => ['students'],
    list:   (page, search, filters)    => ['students', 'list', { page, search, ...filters }],
    detail: (id)                       => ['students', 'detail', id],
    byDojo: (dojoId)                   => ['students', 'byDojo', dojoId],
  },
};
