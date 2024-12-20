// Mengisi tahun otomatis di footer
document.getElementById('year').textContent = new Date().getFullYear();

// Contoh fungsi untuk menambahkan data pengalaman kerja
function addExperience(title, company, years) {
    const experienceList = document.getElementById('experience-list');
    const div = document.createElement('div');
    div.innerHTML = `<strong>${title}</strong> - ${company} (${years})`;
    experienceList.appendChild(div);
}

// Contoh fungsi untuk menambahkan data pendidikan
function addEducation(degree, school, year) {
    const educationList = document.getElementById('education-list');
    const div = document.createElement('div');
    div.innerHTML = `<strong>${degree}</strong>, ${school} (${year})`;
    educationList.appendChild(div);
}

// Contoh fungsi untuk menambahkan keterampilan
function addSkill(skill) {
    const skillsList = document.getElementById('skills-list');
    const li = document.createElement('li');
    li.textContent = skill;
    skillsList.appendChild(li);
}

// Panggil fungsi jika ingin menambahkan data secara langsung
// addExperience('Software Engineer', 'PT ABC', '2020 - 2023');
// addEducation('Sarjana Teknik', 'Universitas XYZ', '2018');
// addSkill('JavaScript');