-- 狗的品种；历史宠物保持为空，服务端在类型为 DOG 时要求必填。
ALTER TABLE pet
    ADD COLUMN dog_breed_id INTEGER
    REFERENCES dog_breed(id) ON DELETE SET NULL;

CREATE INDEX idx_pet_dog_breed
    ON pet(dog_breed_id);