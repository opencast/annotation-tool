{
    scales: [
        {name: "default",
         description: "test",
         values: [
            {name: "--", value: -2, order: 0},
            {name: "-",  value: -1, order: 1},
            {name: "0",  value: 0,  order: 2},
            {name: "+",  value: 1,  order: 3},
            {name: "++",  value: 2,  order: 4},
         ]
        },
        {name: "default2",
         description: "test",
         values: [
            {name: "--", value: -2, order: 0},
            {name: "-",  value: -1, order: 1},
            {name: "0",  value: 0,  order: 2},
            {name: "+",  value: 1,  order: 3},
            {name: "++",  value: 2,  order: 4},
         ]
        },
    ],

    categories: [
        {name: "Socials",
         labels: [
            {value: "Group", abbreviation: "Gp"},
            {value: "Recluse", abbreviation: "Re"}
         ],
         settings: {color:"red"}
         },
        {name: "Actions",
         labels: [
            {value: "Eat", abbreviation: "Ea"},
            {value: "Sleep", abbreviation: "Sl"},
            {value: "Dance", abbreviation: "Da"},
            {value: "Play", abbreviation: "Pl"},
            {value: "Run", abbreviation: "Rn"}
         ],
         settings: {color:"darkcyan"}
         },
        {name: "Feelings",
         labels: [
            {value: "Sadness", abbreviation: "Sn"},
            {value: "Happiness", abbreviation: "Hn"},
            {value: "Despair", abbreviation: "Dp"},
            {value: "Anger", abbreviation: "Ag"}
         ],
         settings: {color:"blue"}
         },
        {name: "Locations",
         labels: [
            {value: "Parking", abbreviation: "Pk"},
            {value: "Airport", abbreviation: "Ap"},
            {value: "School", abbreviation: "Sc"},
            {value: "Mall", abbreviation: "Ml"},
            {value: "Bar", abbreviation: "Br"}
         ],
         settings: {color:"green"}
         }
    ]
}