# AGENTS.md

# Junior Full Stack Developer Coding Rules

## Developer Profile

I am a **Junior Full Stack Developer** and I am still learning programming fundamentals.

I am also learning **React Native** for mobile application development.

My goal is to build real-world applications while understanding the code that I write.

Please write code that is:

- Simple

- Readable

- Maintainable

- Beginner-friendly

- Practical

- Easy to debug

## Most Important Rule

> **Choose the simplest correct solution.**

Do not over-engineer the application.

---

# My Technology Stack

## Web Frontend

- Next.js

- React

- TypeScript

- Tailwind CSS

## Mobile

- React Native

- TypeScript

## Backend

- Python

- FastAPI

## Database

- PostgreSQL

---

# General Coding Rules

## 1. Keep Code Simple

Prefer straightforward code over clever code.

Avoid unnecessary:

- Abstractions

- Design patterns

- Custom frameworks

- Utility functions

- Generic types

- Custom hooks

- Classes

- Layers

- Dependencies

If a simple function can solve the problem, use a simple function.

---

## 2. Do Not Over-Engineer

Do not build an architecture for problems that do not exist yet.

For example, do not automatically create:

```text

Controller

Service

Repository

Factory

Adapter

Strategy

Manager

Helper

Provider

```

unless there is a real reason to use them.

Start simple.

We can refactor later when the project actually needs it.

---

## 3. Use Existing Technologies

Prefer my existing stack:

```text

Next.js

React

TypeScript

Tailwind CSS

React Native

FastAPI

PostgreSQL

```

Do not introduce a new framework or library unless it provides a clear benefit.

Before adding a significant dependency, explain:

1. Why it is needed

2. What problem it solves

3. Whether the existing stack can solve the problem

---

# TypeScript Rules

Use TypeScript properly, but keep the types easy to understand.

Prefer:

```ts
interface User {
  id: number;

  name: string;

  email: string;
}
```

over unnecessarily complicated generic types.

Avoid advanced TypeScript patterns unless they are actually necessary.

## Avoid `any`

Do not use:

```ts
const data: any;
```

unless there is no reasonable alternative.

Prefer proper types.

---

# React Rules

Use functional components.

Prefer simple components:

```tsx

function UserCard({ user }: UserCardProps) {

return (

\<div>

  \<h2>{user.name}\</h2>

  \<p>{user.email}\</p>

\</div>

);

}

```

Avoid unnecessary:

- Custom hooks

- Context providers

- State management libraries

- Component abstractions

Do not create a custom hook for a small piece of logic that is only used once.

---

# Next.js Rules

Follow the existing Next.js project structure.

Do not change the project architecture unless necessary.

Use Server Components and Client Components appropriately.

Use `"use client"` only when needed.

For example, use `"use client"` when the component needs:

- `useState`

- `useEffect`

- Browser APIs

- Client-side event handling

Do not automatically make every component a Client Component.

Keep pages and components simple.

---

# Tailwind CSS Rules

Use Tailwind CSS for styling.

Prefer readable class names.

Example:

```tsx
<button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
  Save
</button>
```

Avoid complicated styling systems for simple components.

Do not introduce another CSS framework unless specifically requested.

---

# React Native Rules

## 1. Keep React Native Code Simple

Write React Native code that is easy for a Junior Developer to read and understand.

Prefer simple components and straightforward logic.

Avoid unnecessary:

- Custom hooks

- State management libraries

- Component abstractions

- Complex navigation patterns

- Unnecessary native modules

- Advanced animations

- Complex architecture

Use the simplest solution that works.

---

## 2. Use Functional Components

Use functional components with React hooks.

Prefer:

```tsx

function ProductCard({ product }: ProductCardProps) {

return (

\<View>

  \<Text>{product.name}\</Text>

\</View>

);

}

```

Avoid class components unless the existing project requires them.

---

## 3. Use React Native Components

Prefer built-in React Native components when possible:

```text

View

Text

TextInput

Pressable

TouchableOpacity

ScrollView

FlatList

Image

Modal

ActivityIndicator

SafeAreaView

```

Do not install a third-party component library when built-in React Native components can reasonably solve the problem.

---

## 4. Styling

Use the project's existing styling approach.

If the project uses `StyleSheet`, prefer:

```tsx
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  title: {
    fontSize: 20,

    fontWeight: "bold",
  },
});
```

If the project already uses a Tailwind-based React Native solution, follow the existing convention.

Do not mix multiple styling approaches unnecessarily.

---

## 5. Responsive UI

Make layouts work on different screen sizes.

Avoid hardcoding large numbers of dimensions unless necessary.

Prefer flexible layouts using:

```text

flex

flexDirection

justifyContent

alignItems

padding

margin

width

maxWidth

```

Test layouts on different screen sizes when possible.

---

## 6. Lists

For lists of data, prefer `FlatList`.

Example:

```tsx
<FlatList
  data={products}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => <ProductCard product={item} />}
/>
```

Do not use `ScrollView` with `.map()` for large or dynamic lists unless there is a good reason.

Keep list rendering simple.

---

## 7. Forms

Keep forms straightforward.

Use controlled inputs when appropriate:

```tsx
const [email, setEmail] = useState("");

<TextInput value={email} onChangeText={setEmail} placeholder="Email" />;
```

Keep validation easy to understand.

Clearly separate:

```text

Input

↓

Validation

↓

API Request

↓

Success / Error

```

Do not introduce a form library unless the project actually needs it.

---

## 8. Navigation

Use the navigation library already installed in the project.

Do not replace the navigation system unless necessary.

Keep navigation logic easy to follow.

Example:

```text

Login

↓

Home

↓

Products

↓

Product Details

```

Avoid deeply nested navigators unless required by the application.

---

## 9. API Integration

Keep React Native API calls simple and predictable.

Prefer:

```text

React Native

  ↓

API Request

  ↓

FastAPI

  ↓

PostgreSQL

```

Clearly define:

- API endpoint

- Request data

- Response data

- Loading state

- Error state

- Success state

Do not hide API requests behind unnecessary abstractions.

---

## 10. Loading States

Handle loading states clearly.

Example:

```tsx
if (loading) {
  return <ActivityIndicator />;
}
```

The user should understand when the application is loading data.

Avoid complicated loading-state systems for simple screens.

---

## 11. Error States

Handle API and application errors clearly.

Example:

```tsx
if (error) {
  return <Text>Unable to load products.</Text>;
}
```

Show useful messages to users.

Do not expose technical errors, API responses, or sensitive information directly to users.

---

## 12. Modal Rules

When creating modals, keep them simple.

Use the React Native `Modal` component when it is sufficient.

Example flow:

```text

User taps item

  ↓

Open Modal

  ↓

Show item information

  ↓

Edit / Save / Cancel

```

Do not create a complicated modal management system unless the application actually requires it.

---

## 13. State Management

Start with React's built-in state:

```text

useState

useEffect

useMemo

useCallback

```

Do not automatically introduce Redux, Zustand, or another state management library.

Only use a state management library when the application has a real need for shared or complex state.

If a state management library is already being used in the project, follow the existing pattern.

---

## 14. TypeScript in React Native

Use TypeScript for:

- Props

- API responses

- Form data

- Navigation parameters

- Component state when useful

Example:

```tsx
interface Product {
  id: number;

  name: string;

  price: number;
}

interface ProductCardProps {
  product: Product;
}
```

Avoid unnecessary advanced TypeScript types.

Avoid `any` whenever a reasonable type can be created.

---

## 15. Platform-Specific Code

Only use platform-specific code when necessary.

Example:

```tsx
import { Platform } from "react-native";

const padding = Platform.OS === "ios" ? 20 : 16;
```

Do not create separate iOS and Android implementations unless the behavior genuinely needs to be different.

---

## 16. Permissions

When using device features such as:

- Camera

- Location

- Notifications

- Storage

- Bluetooth

Keep permission handling explicit and easy to understand.

Explain:

1. Why the permission is needed.

2. Where it is requested.

3. What happens when permission is denied.

Do not silently add permissions.

---

## 17. Images and Assets

Use the appropriate React Native image approach.

For local assets:

```tsx
<Image source={require("./assets/logo.png")} />
```

For remote images:

```tsx
<Image source={{ uri: imageUrl }} />
```

Handle missing or invalid images gracefully.

Do not unnecessarily introduce an image library.

---

## 18. Performance

Keep performance in mind, but do not prematurely optimize.

First make the code:

1. Correct

2. Simple

3. Readable

Only optimize when there is an actual performance problem.

For example, consider:

- `FlatList` for large lists

- `useMemo` for expensive calculations

- `useCallback` when it provides a real benefit

- Image optimization for large images

Do not use optimization techniques everywhere without a reason.

---

## 19. Android and iOS Compatibility

When writing React Native code, consider both Android and iOS.

Avoid code that only works on one platform unless specifically requested.

If a feature behaves differently between Android and iOS, explain the difference.

---

## 20. React Native UI Changes

When modifying an existing screen:

- Read the existing component first.

- Reuse existing components.

- Reuse existing styles.

- Keep the current navigation.

- Keep the current API structure.

- Do not redesign unrelated screens.

Only change what is necessary for the requested feature.

---

## 21. React Native Debugging

When debugging React Native:

1. Identify the error.

2. Explain what it means.

3. Find the affected component or file.

4. Identify the cause.

5. Make the smallest fix.

6. Explain why the fix works.

Do not rewrite an entire screen to fix a small issue.

---

## 22. React Native Learning Mode

I am still learning React Native.

When introducing something unfamiliar, briefly explain:

```text

What it is:

Why we need it:

How it works:

```

Example:

```text

FlatList is used to efficiently display a list of items.

It is better than rendering a large list using

ScrollView because FlatList can render items more efficiently.

```

Keep explanations beginner-friendly.

---

## 23. React Native Final Rule

Do not write React Native code as if you are working with a Senior Mobile Developer.

Write code that I can:

- Read

- Understand

- Debug

- Modify

- Maintain

- Learn from

**Use React Native's built-in features first.**

Only introduce additional libraries or advanced patterns when they solve a real problem.

**Choose the simplest correct React Native solution.**

---

# FastAPI Rules

Keep FastAPI endpoints easy to understand.

Prefer straightforward routes:

```python

@router.get("/users")

async def get_users():

users = await get\_users\_from\_database()

return users

```

Use Pydantic models for request and response validation.

Example:

```python

class UserCreate(BaseModel):

name: str

email: str

```

Keep API responsibilities clear.

Avoid unnecessary layers unless the project requires them.

## API Route Organization

Keep every FastAPI endpoint inside `backend/routes/`.

Keep `backend/main.py` limited to creating the FastAPI app, startup setup, and including routers.

Create a new route file only when it groups related endpoints, such as image endpoints in `routes/images.py`.

## Running FastAPI Locally

Run the backend server from the `backend` folder using:

```bash

uvicorn main:app --reload

```

The terminal is configured to use `backend/.venv` for this command. Do not run it from the project root.

---

# Python Rules

Use simple and readable Python.

Prefer:

```python

if user is None:

raise HTTPException(

    status\_code=404,

    detail="User not found"

)

```

instead of clever one-line solutions that are harder for a beginner to understand.

Use clear variable names.

Prefer:

```python

user_id

user_name

created_user

```

instead of:

```python

uid

un

cu

```

unless the shorter name is a common convention.

---

# PostgreSQL Rules

Use PostgreSQL as the primary database.

Database design should be simple and normalized.

Use clear table and column names.

Example:

```text

users

products

orders

order_items

```

Prefer clear relationships:

```text

users

↓

orders

↓

order_items

↓

products

```

Do not create unnecessary tables or relationships.

Always consider:

- Primary keys

- Foreign keys

- Required fields

- Nullable fields

- Appropriate data types

- Unique constraints

---

# Database Changes

When modifying the database:

1. Explain what is changing.

2. Explain why it is needed.

3. Update the model.

4. Create/update the migration if the project uses migrations.

5. Keep existing data in mind.

Do not casually delete or recreate tables.

Never drop production data unless explicitly instructed.

---

# API Design

Use simple REST-style endpoints.

Example:

```text

GET    /users

GET    /users/{id}

POST   /users

PUT    /users/{id}

DELETE /users/{id}

```

Keep endpoint names predictable.

Use appropriate HTTP status codes.

Example:

```text

200 OK

201 Created

400 Bad Request

404 Not Found

500 Internal Server Error

```

---

# Frontend ↔ Backend

Keep the data flow easy to understand:

```text

Next.js / React / React Native

          ↓

     API Request

          ↓

        FastAPI

          ↓

    Business Logic

          ↓

      PostgreSQL

```

When creating an API integration, clearly define:

- Request data

- API endpoint

- Response data

- Error handling

Do not hide important API behavior behind excessive abstractions.

---

# Error Handling

Handle errors clearly.

Frontend and mobile applications should show useful messages to users.

Backend should return meaningful HTTP errors.

Example:

```python

raise HTTPException(

status\_code=404,

detail="Product not found"

)

```

Avoid exposing sensitive information in API errors.

Do not silently ignore errors.

---

# Authentication

When implementing authentication:

- Keep the implementation understandable.

- Do not create unnecessary authentication layers.

- Never hardcode passwords, tokens, or secrets.

- Use environment variables for sensitive configuration.

Example:

```text

DATABASE_URL=...

SECRET_KEY=...

```

Never commit `.env` files containing real secrets.

---

# Environment Variables

Use `.env` for local configuration.

Example:

```text

DATABASE_URL=postgresql://...

API_URL=http://localhost:8000

SECRET_KEY=...

```

Provide `.env.example` when appropriate.

Example:

```text

DATABASE_URL=

API_URL=

SECRET_KEY=

```

Never expose real credentials in source code.

---

# File Organization

Keep the folder structure simple.

A reasonable full-stack structure is:

```text

project/

│

├── frontend/

│   ├── app/

│   ├── components/

│   ├── lib/

│   └── types/

│

├── mobile/

│   ├── components/

│   ├── screens/

│   ├── navigation/

│   ├── services/

│   ├── types/

│   ├── hooks/

│   └── assets/

│

├── backend/

│   ├── app/

│   │   ├── api/

│   │   ├── models/

│   │   ├── schemas/

│   │   └── main.py

│   │

│   └── migrations/

│

├── AGENTS.md

├── .env.example

└── README.md

```

Do not create folders just for the sake of having a "clean architecture."

---

# Debugging Rules

When I report an error, do NOT immediately rewrite large parts of the application.

Follow this process:

### Step 1 — Identify the Error

Explain what the error means in simple terms.

### Step 2 — Find the Cause

Identify the most likely cause.

### Step 3 — Locate the Problem

Tell me:

```text

File:

Component / Function:

Line / Area:

```

when possible.

### Step 4 — Apply the Smallest Fix

Change only what is necessary.

### Step 5 — Explain the Fix

Briefly explain why the fix works.

---

# When Modifying Existing Code

Before changing code:

1. Read the relevant files.

2. Understand the existing implementation.

3. Reuse existing patterns.

4. Make the smallest reasonable change.

Do not rewrite unrelated code.

Do not rename variables, files, APIs, or components unless necessary.

Do not change the architecture without a good reason.

---

# Learning Mode

I am using Codex not only to build applications but also to learn programming.

When introducing an unfamiliar concept, briefly explain it.

For example:

```text

This uses async/await because the API call is asynchronous.

async allows the function to perform asynchronous work.

await waits for the result without blocking the application.

```

Keep explanations simple.

Do not give extremely advanced explanations unless I ask for them.

---

# Explain Advanced Code

If advanced code is necessary, explain why it is being used.

Do not introduce advanced patterns without explanation.

---

# Code Comments

Do not add comments to every line.

Only add comments when they explain something that is not obvious.

Bad:

```python

# Get user

user = get_user()

```

Good:

```python

# We need the current user before checking ownership.

user = get_user()

```

---

## JWT Authentication Rules

### Purpose

JWT authentication must be implemented in a way that is secure, simple, and easy for a Junior Developer to understand and maintain.

Do not create complicated authentication logic unless the project actually requires it.

---

### 1. Keep JWT Authentication Simple

Follow a simple authentication flow:

````text
Login
  ↓
Check Username/Email + Password
  ↓
Create JWT Token
  ↓
Return Token to Client
  ↓
Client Sends Token with API Requests
  ↓
Backend Validates Token
  ↓
Allow or Reject Request

---

# Testing

When adding an important feature, suggest simple tests or verification steps.

For example:

```text

1. Start the backend.

2. Start the frontend or mobile application.

3. Open the relevant screen.

4. Test the feature.

5. Verify the API response.

6. Verify the database record.

7. Verify the UI result.

````

Do not create an extremely complicated testing architecture unless requested.

---

# Git Rules

Do not modify Git history unless explicitly requested.

Do not run destructive commands such as:

```bash

git reset --hard

git clean -fd

```

without explicit permission.

Do not delete uncommitted work.

When appropriate, suggest a commit message.

Example:

```text

feat: add user login

fix: resolve product API error

refactor: simplify user service

```

---

# Security Rules

Never hardcode:

- Passwords

- API keys

- Database credentials

- Secret keys

- Access tokens

Do not expose secrets in frontend or mobile code.

Do not log sensitive information.

Validate user input.

Use parameterized queries or the project's ORM/database layer.

---

# Before Installing Dependencies

Do not install a package automatically just because it makes the implementation easier.

First check whether the current stack can solve the problem.

If a package is genuinely useful, explain:

```text

Package:

Why we need it:

What problem it solves:

Alternative:

```

Then install it if appropriate.

---

# Before Making Major Changes

If a change affects:

- Database architecture

- Authentication

- API architecture

- Folder structure

- Major dependencies

- Deployment

- Existing features

First explain the proposed change and its impact.

Avoid making large architectural changes without justification.

---

# Communication Style

When working with me, keep explanations:

- Simple

- Direct

- Practical

- Beginner-friendly

Use examples when helpful.

Avoid unnecessary technical jargon.

If you use a technical term that I may not know, explain it briefly.

---

# Priority Order

When making technical decisions, prioritize:

1. Correctness

2. Simplicity

3. Readability

4. Maintainability

5. Security

6. Performance

7. Scalability

Do not sacrifice simplicity for hypothetical future scalability.

---

# Final Rule

I am a **Junior Full Stack Developer learning Web and Mobile Development**.

Do not write code as if you are working with a Senior Developer.

Write code that I can:

- Read

- Understand

- Debug

- Modify

- Maintain

- Learn from

> **Choose the simplest correct solution first.**

If a more advanced solution is genuinely necessary, explain why before implementing it.
