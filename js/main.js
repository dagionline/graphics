import { db } from './firebase-config.js';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

let currentCategory = 'all';
let allWorks = [];

async function loadSiteSettings() {
  try {
    const docRef = doc(db, 'siteSettings', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      document.getElementById('profileImage').src = data.profileImageUrl || '';
      document.getElementById('profileName').textContent = data.name || 'Portfolio';
      document.getElementById('roleText').textContent = data.roleText || '';
      document.getElementById('profileDescription').textContent = data.description || '';
      document.getElementById('navBrand').textContent = data.name || 'Portfolio';
      document.getElementById('footerName').textContent = data.name || 'Portfolio';
      document.title = data.name || 'Portfolio';

      if (data.contact) {
        document.getElementById('contactEmail').textContent = data.contact.email || '';
        document.getElementById('contactPhone').textContent = data.contact.phone || '';
        document.getElementById('contactAddress').textContent = data.contact.address || '';
      }

      if (data.footerLinks && data.footerLinks.length > 0) {
        const footerLinksContainer = document.getElementById('footerLinks');
        footerLinksContainer.innerHTML = data.footerLinks.map(link =>
          `<a href="${link.url}" class="footer-link">${link.label}</a>`
        ).join('');
      }

      if (data.socialLinks && data.socialLinks.length > 0) {
        const socialLinksContainer = document.getElementById('socialLinks');
        socialLinksContainer.innerHTML = data.socialLinks.map(link => {
          const iconText = link.platform.substring(0, 2).toUpperCase();
          return `<a href="${link.url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${link.platform}">${iconText}</a>`;
        }).join('');
      }
    }
  } catch (error) {
    console.error('Error loading site settings:', error);
  }
}

async function loadWorks() {
  try {
    const worksRef = collection(db, 'works');
    const q = query(worksRef);

    onSnapshot(q, (snapshot) => {
      allWorks = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(work => work.visible === true)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      displayWorks();
    });
  } catch (error) {
    console.error('Error loading works:', error);
  }
}

function displayWorks() {
  const worksGrid = document.getElementById('worksGrid');
  const filteredWorks = currentCategory === 'all'
    ? allWorks
    : allWorks.filter(work => work.category === currentCategory);

  worksGrid.innerHTML = filteredWorks.map((work, index) => {
    const imageUrl = work.imageUrls && work.imageUrls.length > 0 ? work.imageUrls[0] : '';
    const projectLink = work.projectUrl ?
      `<a href="${work.projectUrl}" target="_blank" rel="noopener noreferrer">View Project →</a>` : '';

    return `
      <div class="work-card" style="animation-delay: ${index * 0.1}s">
        ${imageUrl ? `<img src="${imageUrl}" alt="${work.title}" loading="lazy" />` : ''}
        <div class="work-card-content">
          <span class="work-card-category">${work.category}</span>
          <h3>${work.title}</h3>
          <p>${work.description || ''}</p>
          ${projectLink}
        </div>
      </div>
    `;
  }).join('');
}

async function loadSkills() {
  try {
    const skillsRef = collection(db, 'skills');
    const q = query(skillsRef);

    onSnapshot(q, (snapshot) => {
      const skills = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const skillsList = document.getElementById('skillsList');
      skillsList.innerHTML = skills.map((skill, index) => `
        <div class="skill-item" style="animation-delay: ${index * 0.1}s">
          <div class="skill-header">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-percent">${skill.percent}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-bar-fill" data-percent="${skill.percent}"></div>
          </div>
        </div>
      `).join('');

      setTimeout(() => {
        document.querySelectorAll('.skill-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.percent + '%';
        });
      }, 100);
    });
  } catch (error) {
    console.error('Error loading skills:', error);
  }
}

function setupCategoryFilter() {
  const categoryButtons = document.querySelectorAll('.btn-category');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = button.dataset.category;
      displayWorks();
    });
  });
}

function setupNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navMenu.classList.remove('active');
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const showMoreBtn = document.getElementById('showMoreBtn');
  showMoreBtn.addEventListener('click', () => {
    document.getElementById('works').scrollIntoView({ behavior: 'smooth' });
  });
}

function setupNotifications() {
  const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');

  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef);

  onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(notification => notification.active === true)
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

    notifications.forEach(notification => {
      if (dismissedNotifications.includes(notification.id)) {
        return;
      }

      const now = new Date();
      const startAt = notification.startAt ? notification.startAt.toDate() : null;
      const endAt = notification.endAt ? notification.endAt.toDate() : null;

      if (startAt && now < startAt) return;
      if (endAt && now > endAt) return;

      showNotificationPopup(notification, notification.id);
    });
  });
}

function showNotificationPopup(notification, notificationId) {
  const popup = document.getElementById('notificationPopup');
  const message = document.getElementById('notificationMessage');
  const ctaButton = document.getElementById('notificationCta');

  message.textContent = notification.message;
  ctaButton.textContent = notification.ctaLabel || 'Learn More';

  ctaButton.onclick = () => {
    if (notification.ctaUrl) {
      window.open(notification.ctaUrl, '_blank');
    }
    dismissNotification(notificationId);
  };

  popup.classList.remove('hidden');

  if (notification.endAt) {
    const endTime = notification.endAt.toDate().getTime();
    const now = Date.now();
    const timeRemaining = endTime - now;

    if (timeRemaining > 0) {
      setTimeout(() => {
        dismissNotification(notificationId);
      }, timeRemaining);
    }
  }
}

function dismissNotification(notificationId) {
  const popup = document.getElementById('notificationPopup');
  popup.classList.add('hidden');

  const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
  if (!dismissedNotifications.includes(notificationId)) {
    dismissedNotifications.push(notificationId);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications));
  }
}

document.getElementById('currentYear').textContent = new Date().getFullYear();

setupNavigation();
setupCategoryFilter();
loadSiteSettings();
loadWorks();
loadSkills();
setupNotifications();
