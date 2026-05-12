import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';

const generateQuestionsMock = vi.fn();

vi.mock('../src/services/api', async () => {
  const actual = await vi.importActual<typeof import('../src/services/api')>('../src/services/api');
  return {
    ...actual,
    generateQuestions: (...args: Parameters<typeof actual.generateQuestions>) =>
      generateQuestionsMock(...args),
  };
});

beforeEach(() => {
  generateQuestionsMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('<App />', () => {
  it('renders the heading and form', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /generate thoughtful interview questions/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate questions/i })).toBeDisabled();
  });

  it('prevents submission of an empty job title and shows a validation message', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(/job title/i);

    await user.type(input, '  ');
    await user.tab();

    expect(generateQuestionsMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/please enter a job title/i)).toBeInTheDocument();
  });

  it('shows loading state and then renders 3 questions on success', async () => {
    let resolveCall!: (value: string[]) => void;
    const pending = new Promise<string[]>((resolve) => {
      resolveCall = resolve;
    });
    generateQuestionsMock.mockImplementation(() => pending);

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/job title/i), 'Backend Engineer');
    await user.click(screen.getByRole('button', { name: /generate questions/i }));

    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    expect(screen.getByText(/thinking through backend engineer/i)).toBeInTheDocument();

    resolveCall(['Q1?', 'Q2?', 'Q3?']);

    await waitFor(() => {
      expect(screen.getByText('Q1?')).toBeInTheDocument();
      expect(screen.getByText('Q2?')).toBeInTheDocument();
      expect(screen.getByText('Q3?')).toBeInTheDocument();
    });
  });

  it('renders an error banner and supports retry on failure', async () => {
    generateQuestionsMock
      .mockRejectedValueOnce(
        Object.assign(new Error('Too many requests.'), {
          name: 'ApiClientError',
          code: 'UPSTREAM_RATE_LIMITED',
        }),
      )
      .mockResolvedValueOnce(['Q1?', 'Q2?', 'Q3?']);

    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/job title/i), 'PM');
    await user.click(screen.getByRole('button', { name: /generate questions/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('Q1?')).toBeInTheDocument();
    });
  });
});
