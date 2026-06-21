// centralized query key factory
export const queryKeys = {
  dojos: {
    all:      ()                         => ['dojos'],
    list:     (page, search)             => ['dojos', 'list', { page, search }],
    detail:   (id)                       => ['dojos', 'detail', id],
    dropdown: ()                         => ['dojos', 'dropdown'],
  },

  students: {
    all:         ()                      => ['students'],
    list:        (page, search, filters) => ['students', 'list', { page, search, ...filters }],
    detail:      (id)                    => ['students', 'detail', id],
    byDojo:      (dojoId)               => ['students', 'byDojo', dojoId],
    beltHistory: (id)                    => ['students', 'beltHistory', id],
  },
};
