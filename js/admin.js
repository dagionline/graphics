import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isAdmin = await checkAdminStatus(user.uid);
    if (isAdmin) {
      currentUser = user;
      showDashboard();
      loadAllData();
    } else {
       showDashboard();
      loadAllData();
    }
  } else {
    showDashboard();
      loadAllData();
  }
});

async function checkAdminStatus(uid) {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists() && adminDoc.data().role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
}

function showError(message) {
  const errorDiv = document.getElementById('authError');
  errorDiv.textContent = message;
  setTimeout(() => {
    errorDiv.textContent = '';
  }, 5000);
}

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  showLoading();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
  hideLoading();
});

document.getElementById('forgotPasswordBtn').addEventListener('click', async () => {
  const email = prompt('Enter your email address:');
  if (email) {
    showLoading();
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    hideLoading();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
});

document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const sectionId = link.dataset.section;
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
  });
});

async function loadAllData() {
  await loadSiteSettings();
  await loadWorks();
  await loadSkills();
  await loadNotifications();
  await loadFooterContact();
}

async function loadSiteSettings() {
  try {
    const docRef = doc(db, 'siteSettings', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('siteName').value = data.name || '';
      document.getElementById('roleText').value = data.roleText || '';
      document.getElementById('description').value = data.description || '';
      document.getElementById('profileImageUrl').value = data.profileImageUrl || '';

      if (data.profileImageUrl) {
        const preview = document.getElementById('profileImagePreview');
        preview.innerHTML = `<img src="${data.profileImageUrl}" alt="Profile" />`;
      }
    }
  } catch (error) {
    console.error('Error loading site settings:', error);
  }
}

document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();

  try {
    const profileImageUrl = document.getElementById('profileImageUrl').value;
    const data = {
      name: document.getElementById('siteName').value,
      roleText: document.getElementById('roleText').value,
      description: document.getElementById('description').value,
      profileImageUrl: profileImageUrl
    };

    if (profileImageUrl) {
      const preview = document.getElementById('profileImagePreview');
      preview.innerHTML = `<img src="${profileImageUrl}" alt="Profile" />`;
    }

    await setDoc(doc(db, 'siteSettings', 'main'), data, { merge: true });
    alert('Settings saved successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }

  hideLoading();
});

document.getElementById('profileImageUrl').addEventListener('input', (e) => {
  const url = e.target.value;
  if (url) {
    const preview = document.getElementById('profileImagePreview');
    preview.innerHTML = `<img src="${url}" alt="Preview" />`;
  }
});

async function loadWorks() {
  try {
    const worksRef = collection(db, 'works');
    const q = query(worksRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    const worksList = document.getElementById('worksList');
    worksList.innerHTML = '';

    snapshot.forEach(doc => {
      const work = doc.data();
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-info">
          <h4>${work.title} <span class="badge ${work.visible ? 'badge-success' : 'badge-danger'}">${work.visible ? 'Visible' : 'Hidden'}</span></h4>
          <p>${work.category} - Order: ${work.order}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small btn-secondary" onclick="editWork('${doc.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteWork('${doc.id}')">Delete</button>
        </div>
      `;
      worksList.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading works:', error);
  }
}

document.getElementById('addWorkBtn').addEventListener('click', () => {
  document.getElementById('workModalTitle').textContent = 'Add Work';
  document.getElementById('workForm').reset();
  document.getElementById('workId').value = '';
  document.getElementById('workImagesPreview').innerHTML = '';
  document.getElementById('workModal').classList.add('active');
});

document.getElementById('closeWorkModal').addEventListener('click', () => {
  document.getElementById('workModal').classList.remove('active');
});

document.getElementById('cancelWorkBtn').addEventListener('click', () => {
  document.getElementById('workModal').classList.remove('active');
});

document.getElementById('workImageUrl').addEventListener('input', (e) => {
  const url = e.target.value;
  if (url) {
    const preview = document.getElementById('workImagesPreview');
    preview.innerHTML = `<img src="${url}" alt="Preview" />`;
  }
});

document.getElementById('workForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();

  try {
    const workId = document.getElementById('workId').value;
    const imageUrl = document.getElementById('workImageUrl').value;

    const data = {
      title: document.getElementById('workTitle').value,
      category: document.getElementById('workCategory').value,
      description: document.getElementById('workDescription').value,
      projectUrl: document.getElementById('workProjectUrl').value,
      visible: document.getElementById('workVisible').checked,
      order: parseInt(document.getElementById('workOrder').value)
    };

    if (imageUrl) {
      data.imageUrls = [imageUrl];
    }

    if (workId) {
      await updateDoc(doc(db, 'works', workId), data);
    } else {
      await addDoc(collection(db, 'works'), data);
    }

    document.getElementById('workModal').classList.remove('active');
    await loadWorks();
    alert('Work saved successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }

  hideLoading();
});

window.editWork = async (workId) => {
  try {
    const workDoc = await getDoc(doc(db, 'works', workId));
    if (workDoc.exists()) {
      const work = workDoc.data();
      document.getElementById('workModalTitle').textContent = 'Edit Work';
      document.getElementById('workId').value = workId;
      document.getElementById('workTitle').value = work.title;
      document.getElementById('workCategory').value = work.category;
      document.getElementById('workDescription').value = work.description || '';
      document.getElementById('workProjectUrl').value = work.projectUrl || '';
      document.getElementById('workVisible').checked = work.visible;
      document.getElementById('workOrder').value = work.order;

      if (work.imageUrls && work.imageUrls.length > 0) {
        document.getElementById('workImageUrl').value = work.imageUrls[0];
        const preview = document.getElementById('workImagesPreview');
        preview.innerHTML = `<img src="${work.imageUrls[0]}" alt="Work image" />`;
      }

      document.getElementById('workModal').classList.add('active');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.deleteWork = async (workId) => {
  if (confirm('Are you sure you want to delete this work?')) {
    showLoading();
    try {
      await deleteDoc(doc(db, 'works', workId));
      await loadWorks();
      alert('Work deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    hideLoading();
  }
};

async function loadSkills() {
  try {
    const skillsRef = collection(db, 'skills');
    const q = query(skillsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '';

    snapshot.forEach(doc => {
      const skill = doc.data();
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-info">
          <h4>${skill.name}</h4>
          <p>${skill.percent}% - Order: ${skill.order}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small btn-secondary" onclick="editSkill('${doc.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteSkill('${doc.id}')">Delete</button>
        </div>
      `;
      skillsList.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading skills:', error);
  }
}

document.getElementById('addSkillBtn').addEventListener('click', () => {
  document.getElementById('skillModalTitle').textContent = 'Add Skill';
  document.getElementById('skillForm').reset();
  document.getElementById('skillId').value = '';
  document.getElementById('skillModal').classList.add('active');
});

document.getElementById('closeSkillModal').addEventListener('click', () => {
  document.getElementById('skillModal').classList.remove('active');
});

document.getElementById('cancelSkillBtn').addEventListener('click', () => {
  document.getElementById('skillModal').classList.remove('active');
});

document.getElementById('skillForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();

  try {
    const skillId = document.getElementById('skillId').value;
    const data = {
      name: document.getElementById('skillName').value,
      percent: parseInt(document.getElementById('skillPercent').value),
      order: parseInt(document.getElementById('skillOrder').value)
    };

    if (skillId) {
      await updateDoc(doc(db, 'skills', skillId), data);
    } else {
      await addDoc(collection(db, 'skills'), data);
    }

    document.getElementById('skillModal').classList.remove('active');
    await loadSkills();
    alert('Skill saved successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }

  hideLoading();
});

window.editSkill = async (skillId) => {
  try {
    const skillDoc = await getDoc(doc(db, 'skills', skillId));
    if (skillDoc.exists()) {
      const skill = skillDoc.data();
      document.getElementById('skillModalTitle').textContent = 'Edit Skill';
      document.getElementById('skillId').value = skillId;
      document.getElementById('skillName').value = skill.name;
      document.getElementById('skillPercent').value = skill.percent;
      document.getElementById('skillOrder').value = skill.order;
      document.getElementById('skillModal').classList.add('active');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.deleteSkill = async (skillId) => {
  if (confirm('Are you sure you want to delete this skill?')) {
    showLoading();
    try {
      await deleteDoc(doc(db, 'skills', skillId));
      await loadSkills();
      alert('Skill deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    hideLoading();
  }
};

async function loadNotifications() {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';

    snapshot.forEach(doc => {
      const notification = doc.data();
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-info">
          <h4>${notification.message.substring(0, 50)}... <span class="badge ${notification.active ? 'badge-success' : 'badge-danger'}">${notification.active ? 'Active' : 'Inactive'}</span></h4>
          <p>CTA: ${notification.ctaLabel}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small btn-secondary" onclick="editNotification('${doc.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteNotification('${doc.id}')">Delete</button>
        </div>
      `;
      notificationsList.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

document.getElementById('addNotificationBtn').addEventListener('click', () => {
  document.getElementById('notificationModalTitle').textContent = 'Add Notification';
  document.getElementById('notificationForm').reset();
  document.getElementById('notificationId').value = '';
  document.getElementById('notificationModal').classList.add('active');
});

document.getElementById('closeNotificationModal').addEventListener('click', () => {
  document.getElementById('notificationModal').classList.remove('active');
});

document.getElementById('cancelNotificationBtn').addEventListener('click', () => {
  document.getElementById('notificationModal').classList.remove('active');
});

document.getElementById('notificationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();

  try {
    const notificationId = document.getElementById('notificationId').value;
    const data = {
      message: document.getElementById('notificationMessage').value,
      ctaLabel: document.getElementById('notificationCtaLabel').value,
      ctaUrl: document.getElementById('notificationCtaUrl').value,
      active: document.getElementById('notificationActive').checked
    };

    const startAt = document.getElementById('notificationStartAt').value;
    const endAt = document.getElementById('notificationEndAt').value;

    if (startAt) {
      data.startAt = Timestamp.fromDate(new Date(startAt));
    }
    if (endAt) {
      data.endAt = Timestamp.fromDate(new Date(endAt));
    }

    if (!notificationId) {
      data.createdAt = Timestamp.now();
    }

    if (notificationId) {
      await updateDoc(doc(db, 'notifications', notificationId), data);
    } else {
      await addDoc(collection(db, 'notifications'), data);
    }

    document.getElementById('notificationModal').classList.remove('active');
    await loadNotifications();
    alert('Notification saved successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }

  hideLoading();
});

window.editNotification = async (notificationId) => {
  try {
    const notificationDoc = await getDoc(doc(db, 'notifications', notificationId));
    if (notificationDoc.exists()) {
      const notification = notificationDoc.data();
      document.getElementById('notificationModalTitle').textContent = 'Edit Notification';
      document.getElementById('notificationId').value = notificationId;
      document.getElementById('notificationMessage').value = notification.message;
      document.getElementById('notificationCtaLabel').value = notification.ctaLabel;
      document.getElementById('notificationCtaUrl').value = notification.ctaUrl;
      document.getElementById('notificationActive').checked = notification.active;

      if (notification.startAt) {
        const startDate = notification.startAt.toDate();
        document.getElementById('notificationStartAt').value = formatDatetimeLocal(startDate);
      }
      if (notification.endAt) {
        const endDate = notification.endAt.toDate();
        document.getElementById('notificationEndAt').value = formatDatetimeLocal(endDate);
      }

      document.getElementById('notificationModal').classList.add('active');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.deleteNotification = async (notificationId) => {
  if (confirm('Are you sure you want to delete this notification?')) {
    showLoading();
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      await loadNotifications();
      alert('Notification deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    hideLoading();
  }
};

function formatDatetimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function loadFooterContact() {
  try {
    const docRef = doc(db, 'siteSettings', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (data.contact) {
        document.getElementById('contactEmail').value = data.contact.email || '';
        document.getElementById('contactPhone').value = data.contact.phone || '';
        document.getElementById('contactAddress').value = data.contact.address || '';
      }

      renderFooterLinks(data.footerLinks || []);
      renderSocialLinks(data.socialLinks || []);
    }
  } catch (error) {
    console.error('Error loading footer contact:', error);
  }
}

let footerLinks = [];
let socialLinks = [];

function renderFooterLinks(links) {
  footerLinks = links;
  const container = document.getElementById('footerLinksList');
  container.innerHTML = footerLinks.map((link, index) => `
    <div class="footer-link-item">
      <input type="text" placeholder="Label" value="${link.label}" onchange="updateFooterLink(${index}, 'label', this.value)" />
      <input type="text" placeholder="URL" value="${link.url}" onchange="updateFooterLink(${index}, 'url', this.value)" />
      <button type="button" class="btn btn-small btn-danger" onclick="removeFooterLink(${index})">Remove</button>
    </div>
  `).join('');
}

function renderSocialLinks(links) {
  socialLinks = links;
  const container = document.getElementById('socialLinksList');
  container.innerHTML = socialLinks.map((link, index) => `
    <div class="social-link-item">
      <input type="text" placeholder="Platform" value="${link.platform}" onchange="updateSocialLink(${index}, 'platform', this.value)" />
      <input type="text" placeholder="URL" value="${link.url}" onchange="updateSocialLink(${index}, 'url', this.value)" />
      <button type="button" class="btn btn-small btn-danger" onclick="removeSocialLink(${index})">Remove</button>
    </div>
  `).join('');
}

window.updateFooterLink = (index, field, value) => {
  footerLinks[index][field] = value;
};

window.removeFooterLink = (index) => {
  footerLinks.splice(index, 1);
  renderFooterLinks(footerLinks);
};

window.updateSocialLink = (index, field, value) => {
  socialLinks[index][field] = value;
};

window.removeSocialLink = (index) => {
  socialLinks.splice(index, 1);
  renderSocialLinks(socialLinks);
};

document.getElementById('addFooterLinkBtn').addEventListener('click', () => {
  footerLinks.push({ label: '', url: '' });
  renderFooterLinks(footerLinks);
});

document.getElementById('addSocialLinkBtn').addEventListener('click', () => {
  socialLinks.push({ platform: '', url: '' });
  renderSocialLinks(socialLinks);
});

document.getElementById('footerContactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();

  try {
    const data = {
      contact: {
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        address: document.getElementById('contactAddress').value
      },
      footerLinks: footerLinks.filter(link => link.label && link.url),
      socialLinks: socialLinks.filter(link => link.platform && link.url)
    };

    await setDoc(doc(db, 'siteSettings', 'main'), data, { merge: true });
    alert('Footer & Contact saved successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }

  hideLoading();
});
