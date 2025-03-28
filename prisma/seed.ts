import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove non-word characters
    .replace(/--+/g, "-"); // Remove multiple -
};

async function updateUserImages() {
  console.log('🔄 Updating user images...');

  const users = await prisma.user.findMany();

  const userImages = [
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  ];

  // Assign images to users in a cyclic manner
  await Promise.all(users.map((user, index) =>
    prisma.user.update({
      where: { id: user.id },
      data: { image: userImages[index % userImages.length] },
    })
  ));

  console.log('✅ User images updated!');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Hash passwords
  const passwordHash = await bcrypt.hash('123456789', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'Admin Prep Track',
      email: 'admin@gmail.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // Create Tags (Only Admin Can Create)
  const tags = ['DSA', 'Web Development', 'AI/ML', 'Cloud Computing', 'Cybersecurity'];

  await prisma.tag.createMany({
    data: tags.map((tag) => ({ name: tag })),
    skipDuplicates: true,
  });

  // Create Student Users
  const students = await prisma.user.createMany({
    data: [
      { name: 'Amit Kumar', email: 'amit@gmail.com', password: passwordHash, role: 'STUDENT' },
      { name: 'Priya Verma', email: 'priya@gmail.com', password: passwordHash, role: 'STUDENT' },
      { name: 'Rahul Joshi', email: 'rahul@gmail.com', password: passwordHash, role: 'STUDENT' },
      { name: 'Sneha Patil', email: 'sneha@gmail.com', password: passwordHash, role: 'STUDENT' },
      { name: 'Vikas Singh', email: 'vikas@gmail.com', password: passwordHash, role: 'STUDENT' },
    ],
  });

  // Fetch users
  const users = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  const allTags = await prisma.tag.findMany();

  // Create Posts with Tags
  const posts = [
    { content: 'Learning DSA on LeetCode!', userId: users[0].id, tags: ['DSA'] },
    { content: 'Understanding system design principles.', userId: users[1].id, tags: ['DSA'] },
    { content: 'Developing my first full-stack app with Next.js.', userId: users[2].id, tags: ['Web Development'] },
    { content: 'Exploring machine learning algorithms.', userId: users[3].id, tags: ['AI/ML'] },
    { content: 'Deploying applications on AWS!', userId: users[4].id, tags: ['Cloud Computing'] },
    { content: 'Studying network security and ethical hacking.', userId: users[0].id, tags: ['Cybersecurity'] },
  ];

  for (const post of posts) {
    const slug = slugify(post.content.split(' ').slice(0, 5).join(' '));
    const createdPost = await prisma.post.create({
      data: {
        content: post.content,
        slug,
        userId: post.userId,
        tags: post.tags
      },
    });

    // Attach Tags to Post
    const postTags = post.tags
  .map((tagName) => {
    const tag = allTags.find((t) => t.name === tagName);
    return tag ? { postId: createdPost.id, tagId: tag.id } : undefined;
  })
  .filter((tag) => tag !== undefined) as { postId: string; tagId: string }[];


    await prisma.postTag.createMany({
      data: postTags,
      skipDuplicates: true,
    });
  }

  // Create Leaderboard Entries (Based on Post Count)
  await prisma.leaderboard.createMany({
    data: users.map((user, index) => ({
      userId: user.id,
      rank: index + 1,
      score: Math.floor(Math.random() * 100) + 1, // Random score between 1 and 100
      postCount: posts.filter((post) => post.userId === user.id).length,
    })),
    skipDuplicates: true,
  });

  // Create Streaks (Tracking Weekly Post Streaks)
  await prisma.streak.createMany({
    data: users.map((user) => ({
      userId: user.id,
      currentStreak: Math.floor(Math.random() * 5), // Random streak between 0-5 weeks
      longestStreak: Math.floor(Math.random() * 10), // Random longest streak between 0-10 weeks
    })),
    skipDuplicates: true,
  });

  await updateUserImages()

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
