-- Update streak whenever user_progress is inserted or updated
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET
    last_active_date = CURRENT_DATE,
    streak_days = CASE
      WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
      WHEN last_active_date = CURRENT_DATE                     THEN streak_days
      ELSE 1
    END,
    longest_streak = GREATEST(
      longest_streak,
      CASE
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        WHEN last_active_date = CURRENT_DATE                     THEN streak_days
        ELSE 1
      END
    ),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_progress_update
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();
