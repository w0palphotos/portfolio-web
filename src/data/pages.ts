export interface AboutData {
  aboutParagraphs: string[]
  interests: { icon: string; title: string; description: string }[]
}

export interface StatusData {
  goals: string[]
  interests: string[]
}

export const aboutData: AboutData = {
  aboutParagraphs: ['about.intro1', 'about.intro2'],
  interests: [
    { icon: 'Monitor', title: 'PC Enthusiast', description: 'Building and optimizing PCs since 2020' },
    { icon: 'Code', title: 'Linux User', description: 'Linux Desktop user since 2023' },
    { icon: 'Camera', title: 'Photographer', description: 'Street photography with camera & smartphone' },
  ],
}

export const statusData: StatusData = {
  goals: ['now.goal0'],
  interests: ['now.interest.photo', 'now.interest.pc', 'now.interest.linux', 'now.interest.web'],
}
