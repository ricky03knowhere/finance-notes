
# Database Structure

users

* id
* email
* full_name
* avatar
* created_at

wallets

* id
* user_id
* name
* icon
* color
* balance
* initial_balance
* created_at

categories

* id
* user_id
* name
* type
* color
* icon

transactions

* id
* wallet_id
* category_id
* type
* amount
* note
* transaction_date
* attachment
* location
* created_at

budgets

* id
* user_id
* category_id
* amount
* month
* year

saving_goals

* id
* user_id
* title
* target_amount
* current_amount
* deadline

bills

* id
* user_id
* title
* amount
* due_date
* recurring
* paid

notifications

* id
* user_id
* title
* body
* is_read

tags

* id
* name

transaction_tags

* transaction_id
* tag_id